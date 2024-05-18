import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as path from 'path';
export const firebase_tools = require('firebase-tools');

const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath, debug: true });

export const firebaseConfig = {
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

export const app = admin.initializeApp(firebaseConfig);
export const store: admin.firestore.Firestore = app.firestore();
export const storage: admin.storage.Storage = app.storage();
