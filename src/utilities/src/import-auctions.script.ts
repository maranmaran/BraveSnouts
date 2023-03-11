require('dotenv').config();
import * as admin from 'firebase-admin';
import moment from 'moment';
import * as XLSX from 'xlsx';

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

// script
(async () => {

    console.log("Import started");

    const filePath = process.cwd() + "\\data\\import.xlsx";
    const options: XLSX.ParsingOptions = {};
    const headers = {
        name: 'Ime',
        desc: 'Opis',
        price: 'Cijena'
    }

    const book: XLSX.WorkBook = XLSX.readFile(filePath, options);
    const sheet = book.Sheets[book.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`File loaded with ${rows.length} rows`);
    
    // generate auction
    let auctionDoc = await store.collection('auctions').doc("imported-auction");
    let auction = {
        id: auctionDoc.id,
        name: "Imported auction",
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
})();

