import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { europeFunctions, store } from "..";
import { Auction, AuctionItem } from "../models/models";

/** Sends email notification to higher bidder */
export const increaseRaisedMoneyFn = europeFunctions.firestore.document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {
    
    const before = change.before.data() as AuctionItem;
    const after = change.after.data() as AuctionItem;

    if(after.bid === before.bid) {
      functions.logger.warn(`Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`);
      return;
    }

    if(!after.user) {
      functions.logger.warn("No user bidded this");
      return;
    }

    const addedMoney = after.bid - (!before.user ? 0 : before.bid);
    functions.logger.info(`Added money is ${addedMoney}`);
    
    if(addedMoney <= 0) {
        functions.logger.error("Bid is the same or lower");
        return null;
    }

    const auctionSnapshot = await store.doc(`auctions/${after.auctionId}`).get();
    const auctionDoc = (await auctionSnapshot.data()) as Auction;

    if(auctionDoc.endDate.seconds + 1 > admin.firestore.Timestamp.fromDate(new Date()).seconds) {
      functions.logger.error("Raised money function invoked out of auction END timeframe");
      return null;
    }
    
    const raisedMoney = (auctionDoc.raisedMoney ?? 0) + addedMoney;
    functions.logger.info(`New raised total is now ${raisedMoney}`);

    await store.doc(`auctions/${after.auctionId}`).update({ raisedMoney });

    return null;
  });