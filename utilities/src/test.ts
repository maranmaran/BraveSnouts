import * as admin from "firebase-admin";
import path from "path";
import { Auction } from "./models";

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });


(async () => {

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


  const auction = (await (
    await store.collection("auctions").doc("01547a2a-af48-47df-8aa9-3563f5773291").get()
  ).data()) as Auction;

  console.log(auction);

  const auctionNano = auction.endDate.seconds;
  const currentNano = admin.firestore.Timestamp.fromDate(new Date()).seconds
  if (auctionNano < currentNano) {
    console.log("ended");
    return;
  }

  console.log("still going");


})();
