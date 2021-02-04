import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as GM from 'gm';
import moment from 'moment';
import * as pathLib from 'path';
import { Picsum } from 'picsum-photos';
import request from 'request';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const magick = GM.subClass({imageMagick: true});

require('dotenv').config();

const downloadImages = async (number = 100, path = './utilities/data/images') => {

    for (let i = 0; i < number; i++) {

        const image = await Picsum.random();
        const dest = `${path}/${i}.jpg`;

        const file = fs.createWriteStream(dest);
        file.on('finish', () => file.close());

        request(image.download_url).pipe(file);
    }
}

const transformImages = async (path = 'C:\\Repos\\BraveSnouts\\utilities\\data\\images') => {

    // get list of all filenames
    // read images one by one
    // do transformation with imagemagick
    //  * resize
    //  * jpeg compress
    //  * make thumb
    // save into processed_images
    // save as image.jpg and image_thumb.jpg

    let files = await fs.readdirSync(path);

    for (const file of files) {


        const originalPath = path;
        const transformedPath = "C:\\Repos\\BraveSnouts\\utilities\\data\\transformed-images";

        const fileName = pathLib.basename(file, pathLib.extname(file));

        // image
        magick(`${originalPath}\\${file}`)
            .strip()
            .interlace('Plane')
            .gaussian(0.05)
            .resize(500, 500)
            .quality(50)
            .compress('JPEG')
            .write(`${transformedPath}\\${fileName}.jpg`, (err) => console.log(err));

        // thumbnail
        magick(`${originalPath}\\${file}`)
            .strip()
            .interlace('Plane')
            .gaussian(0.05)
            .resize(150, 150)
            .quality(50)
            .compress('JPEG')
            .write(`${transformedPath}\\${fileName}_thumb.jpg`, (err) => console.log(err));
    }
}

const importData = async (path = './data/import.xlsx') => {

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

    admin.initializeApp(firebaseConfig);
    const store = admin.firestore();
    const storage = admin.storage();

    console.log("Import started");

    const filePath = process.cwd() + ".\\data\\import.xlsx";
    const options: XLSX.ParsingOptions = {};
    const headers = {
        name: 'Ime',
        desc: 'Opis',
        price: 'Cijena',
        images: 'Slike'
    }

    const book: XLSX.WorkBook = XLSX.readFile(filePath, options);
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`File loaded with ${rows.length} rows`);

    // generate auction
    let auctionDoc = await store.collection('auctions').doc("imported-auction");
    let auction = {
        id: auctionDoc.id,
        name: `Imported auction`,
        description: "This auction has been imported through XLSX",
        startDate: admin.firestore.Timestamp.fromDate(new Date()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
        archived: false,
        processed: false,
    };

    await auctionDoc.set(auction);
    console.log("Auction generated, seeding items...");

    // generate items
    for (let row of rows as any[]) {

        const images = (row[headers.images] as string).split(',');
        const imagesArr = [];
        for(const image of images) {
            // get url
            // let response = await storage.bucket('auction-items').upload("....");
            // console.log(response);

            let res = await storage.bucket("auction-items").upload(`C:\\Repos\\BraveSnouts\\utilities\\data\\transformed-images\\${image}`, { destination: image, contentType: 'image/jpeg' });

            imagesArr.push({
                name: image,
                path: `auction-items/${image}`,
                type: 'image/jpeg',
                // url: ,
            });
        }

        const itemDoc = store.doc(`auctions/${auctionDoc.id}`).collection('items').doc()
        const item = {
            id: itemDoc.id,
            auctionId: auctionDoc.id,
            name: row[headers.name],
            startBid: row[headers.price],
            description: row[headers.desc],
        };

        itemDoc.set(item);
    }

    console.log("Import finished");
}

// downloadImages();
// transformImages();
importData();