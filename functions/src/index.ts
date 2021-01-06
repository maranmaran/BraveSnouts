import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { AuctionItem, UserInfo } from './models/models';
import { auctionEnd } from './services/auctions.service';
import { sendOutbiddedMail } from './services/mail.service';

// Samples:
// https://github.com/firebase/functions-samples

admin.initializeApp();
export const store = admin.firestore();

export const health = functions.https.onRequest((req, resp) => {
  console.log('Healthy');
  resp.status(200).send('healthy');
});

/** Logic containing picking up winners of auction
 * Scheduled 5 minutes behind every full hour in a day
 * Checks for ended auctions in past hour and processes them
 */
export const auctionsEndScheduledFunction = functions.pubsub.schedule('5 0-23 * * *')
  .timeZone('Europe/Zagreb')
  .onRun(async ctx => await auctionEnd());

export const auctionItemBidChange = functions.firestore.document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {
    
    const before = change.before.data() as AuctionItem;
    const after = change.after.data() as AuctionItem;

    if(after.bid == before.bid) {
      console.log(`Same value bid of ${after.bid}`);
      console.log(`Bid IDs: ${after.bidId} and ${before.bidId}`)
    }
    
    // check if starting price and no bids
    if(!after.user) {
      return console.log(`User id is not present. Before:${before.user} After:${after.user}`)
    }

    // check if new bidder
    if (after.user === before.user) {
      return console.log(`Same bidder`)
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
  });

// export const auctionsEndReq = functions.https.onRequest(async (req, resp) => {

//   try {
//     resp.status(200).json(await auctionEnd());
//   } 
//   catch (error) {
//     console.log(error);
//     resp.status(400).send(error);
//   }

// });











// export const auctionsEndFnScheduled = functions.pubsub.schedule('5 0-23 * * *')
// .timeZone('Europe/Zagreb') 
// .onRun(ctx => {
//   return auctionEnd();
// });

// Facebook messaging
// https://developers.facebook.com/docs/messenger-platform/policy/policy-overview#24hours_window
// https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags