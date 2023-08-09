import * as firebase from "firebase-admin";
import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { store } from "../../index.auctions";
import { Auction, AuctionItem } from "./models/models";

// increments raised money on auction whenever bid passes
export const increaseRaisedMoneyFn = functions.region('europe-west1').firestore
  .document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {

    try {
      const before = change.before.data() as AuctionItem;
      const after = change.after.data() as AuctionItem;

      const auction = (await (
        await admin.firestore().collection("auctions").doc(before.auctionId).get()
      ).data()) as Auction;

      functions.logger.debug(auction.endDate.seconds);
      functions.logger.debug(firebase.fireadmin.firestore().Timestamp.fromDate(new Date()).seconds);

      if (
        auction.endDate.seconds <
        firebase.fireadmin.firestore().Timestamp.fromDate(new Date()).seconds
      ) {
        functions.logger.info(`Auction ended`);
        return null;
      }

      if (after.bid === before.bid) {
        functions.logger.warn(
          `Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`
        );
        return;
      }

      if (!after.user) {
        functions.logger.warn("No user bidded this");
        return;
      }

      const addedMoney = after.bid - (!before.user ? 0 : before.bid);
      functions.logger.info(`Added money is ${addedMoney}`);

      if (addedMoney <= 0) {
        functions.logger.error("Bid is the same or lower");
        return null;
      }

      const auctionSnapshot = await store
        .doc(`auctions/${after.auctionId}`)
        .get();
      const auctionDoc = (await auctionSnapshot.data()) as Auction;

      let raisedMoney = (auctionDoc.raisedMoney ?? 0) + addedMoney;
      raisedMoney = Math.round(raisedMoney * 100) / 100;

      functions.logger.info(`New raised total is now ${raisedMoney}`);

      await admin.firestore().doc(`auctions/${after.auctionId}`).update({ raisedMoney });

      return null;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  });
