import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as GM from 'gm';
import * as pathLib from 'path';
import { Picsum } from 'picsum-photos';
import request from 'request';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { Auction } from './models';

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

var firebaseConfig = {
    credential: admin.credential.applicationDefault(),
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = admin.initializeApp(firebaseConfig);
const store = app.firestore();
const storage = app.storage();

const magick = GM.subClass({ imageMagick: true });

require('dotenv').config();

const downloadImagesFn = async (imagesDir: string, number: number) => {
    for (let i = 0; i < number; i++) {

        const image = await Picsum.random();
        const dest = imagesDir;

        const file = fs.createWriteStream(dest);
        file.on('finish', () => file.close());

        request(image.download_url).pipe(file);
    }
}

const transformImagesFn = async (imagesDir: string, transformDir: string) => {

    // get list of all filenames
    // read images one by one
    // do transformation with imagemagick
    //  * resize
    //  * jpeg compress
    //  * make thumb
    // save into processed_images
    // save as image.jpg and image_thumb.jpg

    console.log(`Clearing ${transformDir}`);
    // reset transform dir
    fs.rmdirSync(transformDir, { recursive: true });
    fs.mkdirSync(transformDir)

    console.log(`Reading ${imagesDir} for images to transform`);
    let files = fs.readdirSync(imagesDir);

    for (const file of files) {

        const originalPath = imagesDir;
        const transformedPath = transformDir;

        const fileName = pathLib.basename(file, pathLib.extname(file));

        // image
        magick(`${originalPath}\\${file}`)
        .strip()
        .autoOrient()
        .interlace('Plane')
        .gaussian(0.05)
        .resize(500, 500)
        .quality(100)
        .compress('JPEG')
        .write(`${transformedPath}\\${fileName}.jpg`, (res, err) => console.log(res, err));

        // thumbnail
        magick(`${originalPath}\\${file}`)
        .strip()
        .autoOrient()
        .interlace('Plane')
        .gaussian(0.05)
        .resize(150, 150)
        .quality(100)
        .compress('JPEG')
        .write(`${transformedPath}\\${fileName}_thumb.jpg`, (res, err) => console.log(res, err));
    }

    console.log(`Finished transformation`);
}

const importDataFn = async (importFilePath: string, transformDir: string, auction: Auction) => {

    console.log("Import started");

    const options: XLSX.ParsingOptions = {};
    const headers = {
        id: 'ID',
        name: 'Naziv',
        desc: 'Opis',
        price: 'Cijena',
        images: 'Slike'
    }

    const book: XLSX.WorkBook = XLSX.readFile(importFilePath, options);
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`File loaded with ${rows.length} rows`);
    // generate auction
    let auctionDoc = await store.collection('auctions').doc(auction.id);
    await auctionDoc.set(Object.assign({}, auction), { merge: true });

    console.log("Auction generated, seeding items...");

    // generate items
    for (let row of rows as any[]) {

        const imagesArr = [];
        let imagesStr: string = (row[headers.images])?.toString()?.trim();

        if (imagesStr && imagesStr != "") {
            const images = imagesStr.split(',').map(s => s.trim());

            for (const image of images) {


                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID}.appspot.com/o/auction-items%2F${auction.id}%2F${image}?alt=media`
                await storage.bucket().upload(`${transformDir}\\${image}.jpg`, {
                    destination: `auction-items/${auction.id}/${image}`, gzip: true, public: true, metadata: {
                        cacheControl: 'public,max-age=1210000',
                        contentType: 'image/jpeg',
                        metadata: {
                            firebaseStorageDownloadTokens: uuidv4(),
                        }
                    }
                });

                // thumb
                const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_PROJECT_ID}.appspot.com/o/auction-items%2F${auction.id}%2F${image}_thumb?alt=media`
                await storage.bucket().upload(`${transformDir}\\${image}_thumb.jpg`, {
                    destination: `auction-items/${auction.id}/${image}_thumb`, gzip: true, public: true,
                    metadata: {
                        cacheControl: 'public,max-age=1210000',
                        contentType: 'image/jpeg',
                        metadata: {
                            firebaseStorageDownloadTokens: uuidv4(),
                        }
                    }

                });

                imagesArr.push({
                    name: image,
                    path: `auction-items/${image}`,
                    type: 'image',
                    url: imageUrl,
                    thumb: thumbUrl
                });
            }
        }

        const itemDoc = store.doc(`auctions/${auctionDoc.id}`).collection('items').doc(`${row[headers.id]}`)
        const item = {
            id: row[headers.id],
            auctionId: auctionDoc.id,

            name: row[headers.name],
            description: row[headers.desc] ?? "",

            startBid: row[headers.price] ?? 0,
            media: imagesArr,

            bid: row[headers.price],
        };

        itemDoc.set(item, { merge: true });
    }

    console.log("Import finished");
}

export const importFullAuction = async (
    // flags
    downloadTestImages: boolean = false,
    transformImages: boolean = true,
    importData: boolean = true,

    // dirs
    imagesDir?: string,
    transformImagesDir?: string,
    importFilePath?: string,

    // data
    auction?: Auction,
    amountOfImages?: number,
    simulateBids?: boolean,
) => {

    if (downloadTestImages) {
        await downloadImagesFn(imagesDir as string, amountOfImages as number);
    }

    if (transformImages) {
        await transformImagesFn(imagesDir as string, transformImagesDir as string);
    }

    if (importData) {
        await importDataFn(importFilePath as string, transformImagesDir as string, auction as Auction);
    }
}

    // auction = {
    //     id: auctionDoc.id,
    //     name: `Imported auction`,
    //     description: "This auction has been imported through XLSX",
    //     startDate: admin.firestore.Timestamp.fromDate(new Date()),
    //     endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
    //     archived: false,
    //     processed: false,
    // };