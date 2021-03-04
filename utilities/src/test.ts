import * as admin from 'firebase-admin';
import path from 'path';
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

    const files = (await (await store.collection("/auctions/ce2b63ff-dd67-4ab2-965f-43bc63e2e2e6/items").where('description', "!=", null)).get()).docs;
    
    for(const file of files) {
        let data = file.data();
        if(data.description?.trim() != '') {
            let rawText = htmlToText(data.description).replace(/\s\s+/g, ' ');
            await store.doc(`/auctions/ce2b63ff-dd67-4ab2-965f-43bc63e2e2e6/items/${file.id}`).update({ description: rawText})
        }
    }
})()