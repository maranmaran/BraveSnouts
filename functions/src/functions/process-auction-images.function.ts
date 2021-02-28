import * as admin from 'firebase-admin';
import { logger, RuntimeOptions } from 'firebase-functions';
import * as fs from 'fs';
import * as GM from 'gm';
import { v4 as uuidv4 } from 'uuid';
import { store } from '..';
import { europeFunctions } from '../index';
const path = require('path');
const os = require('os');
const mkdirp = require('mkdirp');
const magick = GM.subClass({ imageMagick: true });

var Promise = require('bluebird');
Promise.promisifyAll(GM.prototype);


const runtimeOpts: RuntimeOptions = {
    timeoutSeconds: 300,
    memory: '512MB',
    maxInstances: 1,
}

/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const processAuctionImagesFn = europeFunctions
.runWith(runtimeOpts)
.https
.onCall(
    async (data, context) => {

        try {
            const auctionId = data.auctionId;
            const imagesTempStoragePath = data.imageBucketPath;

            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            const tempFolder = path.join(os.tmpdir(), "images_to_transform");
            await mkdirp(path.dirname(tempFolder));

            const transformedFolder = path.join(os.tmpdir(), "transformed");
            await mkdirp(path.dirname(transformedFolder));

            // download all images in temp/images_to_transform
            const files = await bucket.getFiles({ prefix: imagesTempStoragePath });
            for (const file of files[0]) {

                const filePath = file.name;
                const fileDir = path.dirname(file.name);
                const fileName = path.basename(file.name, path.extname(file.name));

                await mkdirp(path.dirname(`${tempFolder}/${fileName}`));

                await bucket.file(file.name).download({ destination: `${tempFolder}/${fileName}` });
            }

            // process all images to temp/transformed
            let filesToTransform = fs.readdirSync(tempFolder + "/");
            for (const file of filesToTransform) {

                const fileName = path.basename(file, path.extname(file));

                // image
                await mkdirp(path.dirname(`${transformedFolder}/${fileName}.jpg`));
                
                logger.log("Transforming to " + transformedFolder + "/" + fileName + ".jpg")
                await magick(`${tempFolder}/${file}`)
                .strip()
                .autoOrient()
                .interlace('Plane')
                .gaussian(0.05)
                .resize(500, 500)
                .quality(50)
                .compress('JPEG')
                .writeAsync(`${transformedFolder}/${fileName}.jpg`);
                
                // thumbnail
                await mkdirp(path.dirname(`${transformedFolder}/${fileName}_thumb.jpg`));
                
                logger.log("Transforming to " + transformedFolder + "/" + fileName + "_thumb.jpg")
                await magick(`${tempFolder}/${file}`)
                .strip()
                .autoOrient()
                .interlace('Plane')
                .gaussian(0.05)
                .resize(150, 150)
                .quality(50)
                .compress('JPEG')
                .writeAsync(`${transformedFolder}/${fileName}_thumb.jpg`);

                fs.unlinkSync(`${tempFolder}/${file}`);
            }

            // upload to bucket under auction-items/auctionId/...
            const imagesArr = [];
            for (const file of filesToTransform) {
                let image = path.basename(file, path.extname(file));

                logger.info("Uploading " + image);

                await bucket.upload(`${transformedFolder}/${image}.jpg`, {
                    destination: `auction-items/${auctionId}/${image}`, gzip: true, public: true, metadata: {
                        cacheControl: 'public,max-age=604800',
                        contentType: 'image/jpeg',
                        metadata: {
                            firebaseStorageDownloadTokens: uuidv4(),
                        }
                    }
                });

                // thumb
                await bucket.upload(`${transformedFolder}/${image}_thumb.jpg`, {
                    destination: `auction-items/${auctionId}/${image}_thumb`, gzip: true, public: true,
                    metadata: {
                        cacheControl: 'public,max-age=604800',
                        contentType: 'image/jpeg',
                        metadata: {
                            firebaseStorageDownloadTokens: uuidv4(),
                        }
                    }
                });
                
                fs.unlinkSync(`${transformedFolder}/${image}.jpg`);
                fs.unlinkSync(`${transformedFolder}/${image}_thumb.jpg`);

                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.instanceId().app.options.projectId}.appspot.com/o/auction-items%2F${auctionId}%2F${image}?alt=media`
                const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${admin.instanceId().app.options.projectId}.appspot.com/o/auction-items%2F${auctionId}%2F${image}_thumb?alt=media`

                imagesArr.push({
                    name: image,
                    path: `auction-items/${image}`,
                    type: 'image',
                    url: imageUrl,
                    thumb: thumbUrl
                });
            }

            // create auction items and add them to subcollection items in auction
            for (const images of imagesArr) {

                const itemId = uuidv4();
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
            }

            return auctionId;
        } catch (error) {
            logger.error(error);
            throw new Error(error);
        }
    });
