import * as admin from 'firebase-admin';
import path from 'path';
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

(async () => {
    const files = await bucket.getFiles({prefix: "temp/f14db85a-669b-4ae1-b761-dbae23b5a84c"});
    
    for(const file of files[0]) {
        console.log(file.name);
    }
})()