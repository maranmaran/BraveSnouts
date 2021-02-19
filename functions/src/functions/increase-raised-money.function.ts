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
    }

    const addedMoney = after.bid - (before.bid ?? 0);
    
    if(addedMoney <= 0) {
        functions.logger.error("Bid is the same or lower");
        return null;
    }

    const auctionSnapshot = await store.doc(`auctions/${after.auctionId}`).get();
    const auctionDoc = (await auctionSnapshot.data()) as Auction;

    const raisedMoney = (auctionDoc.raisedMoney ?? 0) + addedMoney;

    await store.doc(`auctions/${after.auctionId}`).update({ raisedMoney });

    return null;
  });