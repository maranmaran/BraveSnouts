import * as admin from 'firebase-admin';
import path from 'path';
import * as XLSX from 'xlsx';
const { htmlToText } = require('html-to-text');

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

admin.initializeApp(firebaseConfig);
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
const store = admin.firestore();

(async () => {

    const users = (await (await store.collection("/users/")).get()).docs;
    
    let sheetData = [];
    for(const user of users) {
        let userData = user.data();
        let id = userData.id;

        sheetData.push([userData.displayName, userData.email]);
        // let informUser = {
        //     message: `Pozdrav ${userData.displayName.split(' ')[0]}, htjeli bi te 
        //     informirati da smo popravili pregled predmeta u <b><a href="https://hrabrenjuske.hr/app/my-items">Moji predmeti</a></b>.` 
        // };
        // await store.doc(`/users/${id}`).update({ informUser });
    }

    const wb = XLSX.utils.book_new();
    wb.SheetNames.push("Mailovi"); 
    
    const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
    wb.Sheets["Mailovi"] = ws1;

    XLSX.writeFile(wb, `Mailovi - 28.03.21.xlsx`, { bookType: 'xlsx'} );


})()