require('dotenv').config();
import * as admin from 'firebase-admin';
import { Auction, AuctionItem } from './models';
import moment from 'moment';


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

  // generate auction
  let auction = new Auction({
    name: "Big auction",
    description: "This big auction is generated and is for testing",
    startDate: admin.firestore.Timestamp.fromDate(new Date()),
    endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
    archived: false,
    processed: false,
  });

  // write auction and scaffold id
  let auctionDoc = await store.collection('auctions').doc("big-auction");
  await auctionDoc.set(Object.assign({}, auction));
  let auctionId = auctionDoc.id;

  console.log('Created auction');

  // generate items
  await store.runTransaction(async (tran) => {

    for (let i = 0; i < 400; i++) {

      let item = new AuctionItem({
        id: i.toString(),
        auctionId,
        name: `Item ${i}`,
        description: `Item ${i} description`,
        startBid: 0,
        media: [
          {
            name: `Media ${i}`,
            path: `auction-items/5f74c211-e1d4-6727-baef-0fa21331aabe.jpg`,
            type: 'image'
          }
        ],
      });

      // write items to auction
      let doc = store.doc(`auctions/${auctionId}`).collection('items').doc(`${item.id}`)
      tran.set(doc, Object.assign({}, item));

      console.log('Created item ' + i);
    }

  });

})();

