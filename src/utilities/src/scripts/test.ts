// import * as admin from "firebase-admin";
// import path from "path";
// import { AuctionItem } from "../models";

// require("dotenv").config({ path: path.resolve(__dirname, "../.env") });


// (async () => {

//   console.log('hey');
//   return;

//   var firebaseConfig = {
//     credential: admin.credential.applicationDefault(),
//     apiKey: process.env.FIREBASE_API_KEY,
//     authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//     databaseURL: process.env.FIREBASE_DATABASE_URL,
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.FIREBASE_APP_ID,
//     measurementId: process.env.FIREBASE_MEASUREMENT_ID,
//   };

//   admin.initializeApp(firebaseConfig);
//   const store = admin.firestore();

//   const auctionsToFix = [
//     '0cecca06-8ff1-4745-80f4-2f61255a8ca7',
//     '19fee63a-378c-4798-8d6c-8245e7ee60d5',
//     '54b4cf6a-9cd0-4dea-86e0-1996f082f364',
//     '6fa9d50c-8e77-4af2-bd7d-ce997a074019',
//     'e72a1e92-3f22-4200-bb84-d731843c6561',
//   ];

//   for (const auctionId of auctionsToFix) {

//     const itemsQuery = store.doc(`auctions/${auctionId}`).collection('items');
//     const itemsSnapshot = await itemsQuery.get();
//     const items = itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AuctionItem[];

//     for (const item of items) {
//       for (const mediaItem of item.media) {
//         mediaItem.url = mediaItem.url.replace('auction-items', 'temp');
//         mediaItem.thumb = mediaItem.url.replace('auction-items', 'temp');
//       }

//       const itemDoc = store.doc(`auctions/${auctionId}`).collection('items').doc(item.id)
//       await itemDoc.update({ media: item.media });
//     }
//   }

//   console.log('Done');
// })();
