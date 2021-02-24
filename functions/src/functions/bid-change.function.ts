import * as functions from 'firebase-functions';
import { europeFunctions, store } from "../index";
import { AuctionItem, EmailSettings, User, UserInfo } from "../models/models";
import { sendOutbiddedMail } from "../services/mail.service";


/** Sends email notification to higher bidder */
export const bidChangeFn = europeFunctions.firestore.document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {
    
    const before = change.before.data() as AuctionItem;
    const after = change.after.data() as AuctionItem;

    if(after.bid === before.bid) {
      functions.logger.warn(`Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`);
    }
    
    if(!after.user || !before.user) {
      functions.logger.info(`User id is not present. Before:${before.user} After:${after.user}`);
      return null;
    }

    if (after.user === before.user) {
      functions.logger.warn(`Same bidder`);
      return null;
    }

    // check permission
    const userEmailSettings = ((await store.collection("users").doc(before.user).get()).data()?.emailSettings as EmailSettings)?.bidUpdates;
    if(!userEmailSettings) {
      console.warn(`Didn't send bid update to user because he either opted out or was not found. ${before.user}`);
    }

    // get outbidded user information
    const outbiddedUserData = await (await store.collection("users").doc(before.user).get()).data() as User;
    if(!outbiddedUserData) {
      console.error("Can not find user");
    }
    
    const oubiddedUser: UserInfo = {
      id: before.user,
      name: outbiddedUserData.displayName as string,
      email: outbiddedUserData.email as string,
      phoneNumber: outbiddedUserData.phoneNumber
    };
    
    // send mail template
    // Send to outbidded user information about which item name was outbidded
    // and by how much (previous and new bid value)

    if(outbiddedUserData?.emailSettings?.bidUpdates) {
      // TODO - send only if user is not present currently on browser (online) 
      await sendOutbiddedMail(oubiddedUser, before, after);
    } else {
      console.warn("User chose to opt out")
    }

    return null;
  });
