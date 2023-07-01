/* eslint-disable eqeqeq */
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import * as fs from 'fs';
import { mkdirp } from 'mkdirp';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { europeFunctions, store } from '..';
import { AuctionItem, FirebaseFile } from '../models/models';
import { getAuctionItems } from './end-auction.function';

const path = require('path');
const os = require('os');

// TODO: Deprecate some settings
interface ImageProcessingSettings {
    compress: boolean;
    compressQuality: number;
    compressResizeHeight: number;
    compressResizeWidth: number;
    compressMethod: string;
    compressExtension: string; enableProdMode
}

// TODO: make it react on event of image 
// do single transformation with multiple function invocations

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

            const auctionId = data.auctionId;
            const originalImagesPath = data.imageBucketPath;
            logger.info(`Processing auction: ${auctionId} from original images path ${originalImagesPath}`);

            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            const files = await bucket.getFiles({ prefix: originalImagesPath });
            const imagesArr: FirebaseFile[] = []; // image links to add to auction items

            // make local folders where we'll process the images
            const localFolderUID = uuidv4(); // in case functions preserve some kind local cache

            const tempFolder = path.join(os.tmpdir(), "auction-images", localFolderUID);
            const thumbFolder = path.join(tempFolder, "/thumb");
            const originalFolder = path.join(tempFolder, "/original");
            const compressedFolder = path.join(tempFolder, "/compressed");

            await mkdirp(path.dirname(tempFolder));
            await mkdirp(path.dirname(thumbFolder));
            await mkdirp(path.dirname(originalFolder));
            await mkdirp(path.dirname(compressedFolder));

            //#region Download from temp
            logger.log("Downloading images");
            let downloadJobs: Promise<void>[] = [];
            for (const file of files[0]) {
                // buffer
                if (downloadJobs.length == bufferSize) {
                    await Promise.all(downloadJobs);
                    downloadJobs = [];
                }

                downloadJobs.push(new Promise<void>(async (res, err) => {
                    let fileName = path.basename(file.name, path.extname(file.name)) as string;
                    fileName = fileName.replace('_original', '');

                    const destination = `${originalFolder}/${fileName}`;
                    await mkdirp(path.dirname(destination));

                    logger.info(`Downloading ${file.name} into ${destination}`);
                    await bucket.file(file.name).download({ destination });
                    res();
                }));
            }
            await Promise.all(downloadJobs);
            logger.log("Finished downloading images");
            //#endregion

            //#region Transform downloaded images 
            // process all images to temp/transformed
            let transformJobs: Promise<void>[] = [];
            const filesToTransform = fs.readdirSync(originalFolder + "/");
            for (const file of filesToTransform) {

                // buffer
                if (transformJobs.length == bufferSize) {
                    await Promise.all(transformJobs);
                    transformJobs = [];
                }

                transformJobs.push(new Promise<void>(async (res, err) => {
                    const fileName = path.basename(file, path.extname(file));
                    const originalPath = `${originalFolder}/${fileName}`;
                    const thumbPath = `${thumbFolder}/${fileName}_thumb.jpg`;
                    const compressedPath = `${compressedFolder}/${fileName}_compressed.jpg`;

                    // COMPRESSED
                    await mkdirp(path.dirname(compressedPath));
                    logger.log(`Transforming to ${compressedPath}`);

                    await sharp(originalPath)
                        .resize({
                            width: settings.compressResizeWidth ?? 500,
                            height: settings.compressResizeHeight ?? 500,
                            fit: 'inside',
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        })
                        .jpeg({ quality: settings.compressQuality ?? 50, progressive: true })
                        .toFile(compressedPath);

                    // THUMB
                    await mkdirp(path.dirname(thumbPath));
                    logger.log(`Transforming to ${thumbPath}`);

                    await sharp(originalPath)
                        .resize({
                            width: 80,
                            height: 80,
                            fit: 'inside',
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        })
                        .jpeg({ quality: 85, progressive: true })
                        .toFile(thumbPath);

                    res();
                }))
            }
            await Promise.all(transformJobs);
            //#endregion

            //#region Upload processed images
            let uploadJobs: Promise<void>[] = [];
            for (const file of filesToTransform) {
                // buffer
                if (uploadJobs.length == bufferSize) {
                    await Promise.all(uploadJobs);
                    uploadJobs = [];
                }

                uploadJobs.push(new Promise<void>(async (res, err) => {
                    const image = path.basename(file, path.extname(file));
                    const thumbImage = `${thumbFolder}/${image}_thumb.jpg`;
                    const compressedImage = `${compressedFolder}/${image}_compressed.jpg`;

                    const auctionDest = `auction-items/${auctionId}`;
                    const thumbDestination = `${auctionDest}/thumb/${image}_thumb.jpg`;
                    const compressedDest = `${auctionDest}/compressed/${image}_compressed.jpg`;
                    const originalDestination = `${auctionDest}/original/${image}_original.jpg`;

                    const uploadOptions = {
                        gzip: true,
                        public: true,
                        metadata: {
                            cacheControl: 'public,max-age=1210000',
                            contentType: 'image/jpeg',
                            metadata: {
                                firebaseStorageDownloadTokens: uuidv4(),
                            }
                        }
                    };

                    logger.info(`Uploading ${image}_compressed.jpg`);
                    const compressedRes = await bucket.upload(compressedImage, { destination: compressedDest, ...uploadOptions });

                    logger.info(`Uploading ${image}_thumb.jpg`);
                    const thumbRes = await bucket.upload(thumbImage, { destination: thumbDestination, ...uploadOptions });

                    fs.unlinkSync(thumbImage);
                    fs.unlinkSync(compressedImage);

                    logger.info(`Getting URLs`);
                    const urlThumb = thumbRes[0].publicUrl();
                    const urlComp = compressedRes[0].publicUrl();
                    const urlOrig = bucket.file(originalDestination).publicUrl()

                    imagesArr.push({
                        name: image,
                        path: auctionDest,
                        type: 'image/jpeg',
                        urlOrig, urlThumb, urlComp
                    });

                    res();
                }))
            }
            await Promise.all(uploadJobs);
            //#endregion

            logger.debug(`Total images: ${imagesArr.length}`);

            await upsertAuctionItems(auctionId, imagesArr);

            return auctionId;
        });

async function upsertAuctionItems(auctionId: string, imagesArr: FirebaseFile[]) {
    let items: AuctionItem[] = [];
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

}

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


