/* eslint-disable eqeqeq */
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import * as fs from 'fs';
import * as GM from 'gm';
import { v4 as uuidv4 } from 'uuid';
import { europeFunctions, store } from '..';
import { AuctionItem } from '../models/models';
import { getAuctionItems } from './end-auction.function';

const path = require('path');
const os = require('os');
const mkdirp = require('mkdirp');
const magick = GM.subClass({ imageMagick: true });

const blueBirdPromise = require("bluebird");
blueBirdPromise.promisifyAll(GM.prototype);

interface ImageProcessingSettings {
    compress: boolean;
    compressQuality: number;
    compressResizeHeight: number;
    compressResizeWidth: number;
    compressMethod: string;
    compressExtension: string; enableProdMode
}

// const runtimeOpts: RuntimeOptions = {
//     timeoutSeconds: 300,
//     memory: '512MB',
//     maxInstances: 1,
// }

/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const processAuctionImagesFn = europeFunctions
    // .runWith(runtimeOpts)
    .https
    .onCall(
        async (data, context) => {

            const settings = (await store.doc("config/image-processing").get()).data() as ImageProcessingSettings;

            logger.info('Loaded settings:' + JSON.stringify(settings));

            const bufferSize = 20;

            try {
                let auctionId = data.auctionId;
                let imagesTempStoragePath = data.imageBucketPath;

                // auctionId = "962b0bf2-08f8-49ae-92d9-cdacc5c5ed79"
                // imagesTempStoragePath = "auction-items/962b0bf2-08f8-49ae-92d9-cdacc5c5ed79/962b0bf2-08f8-49ae-92d9-cdacc5c5ed79"

                logger.info(`Processing auction: ${auctionId} and path ${imagesTempStoragePath}`);

                const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
                const files = await bucket.getFiles({ prefix: imagesTempStoragePath });
                const imagesArr = []; // image links to add to auction items

                const localFolderGuid = uuidv4();

                if (settings.compress) {
                    const tempFolder = path.join(os.tmpdir(), "images_to_transform" + `/${localFolderGuid}`);
                    await mkdirp(path.dirname(tempFolder));

                    const transformedFolder = path.join(os.tmpdir(), "transformed" + `/${localFolderGuid}`);
                    await mkdirp(path.dirname(transformedFolder));

                    //#region Download from temp
                    // download all images in temp/images_to_transform
                    logger.log("Downloading images");
                    let downloadJobs: Promise<void>[] = [];
                    for (const file of files[0]) {

                        // buffer
                        if (downloadJobs.length == bufferSize) {
                            await Promise.all(downloadJobs);
                            downloadJobs = [];
                        }

                        downloadJobs.push(new Promise<void>(async (res, err) => {
                            // const filePath = file.name;
                            // const fileDir = path.dirname(file.name);
                            const fileName = path.basename(file.name, path.extname(file.name));
                            logger.info("Downloading " + fileName);
                            await mkdirp(path.dirname(`${tempFolder}/${fileName}`));
                            await bucket.file(file.name).download({ destination: `${tempFolder}/${fileName}` });
                            res();
                        }));
                    }
                    await Promise.all(downloadJobs);
                    logger.log("Finished downloading images");
                    //#endregion

                    //#region Transform downloaded images 
                    // process all images to temp/transformed
                    let transformJobs: Promise<void>[] = [];
                    const filesToTransform = fs.readdirSync(tempFolder + "/");
                    for (const file of filesToTransform) {

                        // buffer
                        if (transformJobs.length == bufferSize) {
                            await Promise.all(transformJobs);
                            transformJobs = [];
                        }

                        transformJobs.push(new Promise<void>(async (res, err) => {
                            const fileName = path.basename(file, path.extname(file));

                            // image
                            await mkdirp(path.dirname(`${transformedFolder}/${fileName}.jpg`));

                            logger.log("Transforming to " + transformedFolder + "/" + fileName + ".jpg")
                            try {
                                await magick(`${tempFolder}/${file}`)
                                    .strip()
                                    .autoOrient()
                                    .interlace('Plane')
                                    .gaussian(0.05)
                                    .resize(settings.compressResizeWidth ?? 500, settings.compressResizeHeight ?? 500)
                                    .quality(settings.compressQuality ?? 50)
                                    .compress(settings.compressMethod ?? 'JPEG')
                                    .writeAsync(`${transformedFolder}/${fileName}.${settings.compressExtension ?? 'jpg'}`);
                            } catch (errorMagick) {
                                console.error(errorMagick);
                            }

                            // // thumbnail
                            // await mkdirp(path.dirname(`${transformedFolder}/${fileName}_thumb.jpg`));

                            // logger.log("Transforming to " + transformedFolder + "/" + fileName + "_thumb.jpg")
                            // await magick(`${tempFolder}/${file}`)
                            //     .strip()
                            //     .autoOrient()
                            //     // .interlace('Plane')
                            //     .gaussian(0.05)
                            //     // .resize(150, 150)
                            //     .quality(85)
                            //     .compress('JPEG')
                            //     .writeAsync(`${transformedFolder}/${fileName}_thumb.jpg`);

                            // fs.unlinkSync(`${tempFolder}/${file}`);
                            res();
                        }))
                    }
                    await Promise.all(transformJobs);
                    //#endregion

                    //#region Upload processed images
                    // upload to bucket under auction-items/auctionId/...
                    let uploadJobs: Promise<void>[] = [];
                    for (const file of filesToTransform) {

                        // buffer
                        if (uploadJobs.length == bufferSize) {
                            await Promise.all(uploadJobs);
                            uploadJobs = [];
                        }

                        uploadJobs.push(new Promise<void>(async (res, err) => {
                            const image = path.basename(file, path.extname(file));

                            logger.info("Uploading " + image);

                            try {
                                await bucket.upload(`${transformedFolder}/${image}.jpg`, {
                                    destination: `auction-items/${auctionId}/${image}`, gzip: true, public: true, metadata: {
                                        cacheControl: 'public,max-age=1210000',
                                        contentType: 'image/jpeg',
                                        metadata: {
                                            firebaseStorageDownloadTokens: uuidv4(),
                                        }
                                    }
                                });
                                fs.unlinkSync(`${transformedFolder}/${image}.jpg`);
                            } catch (bucketErr) {
                                console.error(bucketErr);
                            }

                            // await bucket.upload(`${transformedFolder}/${image}_thumb.jpg`, {
                            //     destination: `auction-items/${auctionId}/${image}_thumb`, gzip: true, public: true,
                            //     metadata: {
                            //         cacheControl: 'public,max-age=1210000',
                            //         contentType: 'image/jpeg',
                            //         metadata: {
                            //             firebaseStorageDownloadTokens: uuidv4(),
                            //         }
                            //     }
                            // });
                            // fs.unlinkSync(`${transformedFolder}/${image}_thumb.jpg`);

                            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.instanceId().app.options.projectId}.appspot.com/o/auction-items%2F${auctionId}%2F${image}?alt=media`
                            // const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.instanceId().app.options.projectId}.appspot.com/o/auction-items%2F${auctionId}%2F${image}_thumb?alt=media`

                            imagesArr.push({
                                name: image,
                                path: `auction-items/${auctionId}`,
                                fullPath: `auction-items/${auctionId}/${image}`,
                                tempPath: `temp/${auctionId}/${image}`,
                                type: 'image',
                                url: imageUrl,
                                thumb: imageUrl,
                                tempUrl: imageUrl.replace('auction-items', 'temp')
                            });

                            res();
                        }))
                    }
                    await Promise.all(uploadJobs);
                    //#endregion

                } else {
                    // just create links from already uploaded images
                    for (const file of files[0]) {
                        const image = path.basename(file.name, path.extname(file.name));

                        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.instanceId().app.options.projectId}.appspot.com/o/temp%2F${auctionId}%2F${image}?alt=media`

                        imagesArr.push({
                            name: image,
                            path: `auction-items/${auctionId}`,
                            fullPath: `auction-items/${auctionId}/${image}`,
                            tempPath: `temp/${auctionId}/${image}`,
                            type: 'image',
                            tempUrl: imageUrl,
                            url: imageUrl,
                            thumb: imageUrl
                        });
                    }
                }

                logger.debug(`Images arr length is ${imagesArr.length}`);

                let items = [];
                try {
                    items = await getAuctionItems(auctionId);

                    if (items.length > 0) {
                        await modifyExistingItemsWithImages(auctionId, items, imagesArr);
                    }
                } catch {
                    logger.info("No items.. creating new ones");
                }

                if (items.length == 0) {
                    await createNewItemsWithImages(auctionId, imagesArr);
                }

                return auctionId;
            } catch (error) {
                logger.error(error);
                throw error;
            }
        });

async function modifyExistingItemsWithImages(auctionId, items: AuctionItem[], imagesArr) {
    if (items.length == 0) {
        return;
    }

    logger.info("Detected existing items.. modifying");

    // map images by name
    const imagesMap = new Map();
    for (const images of imagesArr) {
        imagesMap.set(images.name, images);
    }

    // update each item where image has the name
    for (const item of items) {
        if (item.media.length == 0) {
            continue;
        }

        const key = item.media[0].name;
        const imageData = imagesMap.get(key);

        if (imageData != null && imageData.length > 0) {
            logger.info("Updating image on item " + item.id);
            const itemDoc = store.doc(`auctions/${auctionId}`).collection('items').doc(item.id)
            await itemDoc.update({ media: imageData });
        }
    }
}

async function createNewItemsWithImages(auctionId, imagesArr) {

    logger.info("No preexisting items.. creating");

    // create auction items and add them to subcollection items in auction
    const setJobs: Promise<void>[] = [];
    for (const images of imagesArr) {

        const job = new Promise<void>(async (res, err) => {
            const itemId = uuidv4();

            logger.info("Creating new item " + itemId);
            const itemDoc = store.doc(`auctions/${auctionId}`).collection('items').doc(itemId)
            const item = {
                id: itemId,
                auctionId: auctionId,

                name: '',
                description: '',
                media: [images],

                startBid: 0,
                bid: 0,
            };

            await itemDoc.set(item, { merge: true });
            res();
        });
        setJobs.push(job);
    }
    await Promise.all(setJobs);
}


