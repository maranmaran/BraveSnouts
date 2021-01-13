import { AuctionItem, UserInfo } from "../models/models";
import { sendOutbiddedMail } from "../services/mail.service";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { europeFunctions } from "../index";


/** Sends email notification to higher bidder */
export const auctionItemBidChange = europeFunctions.firestore.document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {
    
    const before = change.before.data() as AuctionItem;
    const after = change.after.data() as AuctionItem;

    if(after.bid === before.bid) {
      functions.logger.warn(`Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`);
    }
    
    // check if starting price and no bids
    if(!after.user) {
      functions.logger.info(`User id is not present. Before:${before.user} After:${after.user}`);
      return null;
    }

    // check if new bidder
    if (after.user === before.user) {
      functions.logger.warn(`Same bidder`);
      return null;
    }

    // get outbidded user information
    const outbiddedUserData = await admin.auth().getUser(before.user);
    const oubiddedUser: UserInfo = {
      id: before.user,
      name: outbiddedUserData.displayName as string,
      email: outbiddedUserData.email as string,
    };
    
    // send mail template
    // Send to outbidded user information about which item name was outbidded
    // and by how much (previous and new bid value)

    // TODO - send only if user is not present currently on browser (online) 
    await sendOutbiddedMail(oubiddedUser, before, after);

    return null;
  });
