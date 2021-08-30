import * as admin from "firebase-admin";
import { AuctionItem } from "./models";

// must have for google credentials and my own .env mapping
require("dotenv").config({ path: process.cwd() + "\\utilities\\.env" });
console.log(process.cwd() + "\\utilities\\.env");

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

(async () => {
  const auctionId = "WWITkUT2WNoU6SUDLOOt";

  try {
    const items = (await store.collection(`auctions/${auctionId}/items`).get())
      .docs;

    for (const item of items) {
      const itemData = item.data() as AuctionItem;
      itemData.media.forEach((m) => {
        m.path = m.path.replace(
          "75ac4b7d-b62c-4953-8bce-6799decac9ad",
          auctionId
        );
        m.url = m.url.replace(
          "75ac4b7d-b62c-4953-8bce-6799decac9ad",
          auctionId
        );
      });

      await store
        .doc(`auctions/${auctionId}/items/${itemData.id}`)
        .update({ media: itemData.media });
    }
  } catch (error) {
    console.log("Error " + error);
    return;
  }
})();
