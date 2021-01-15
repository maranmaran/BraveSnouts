import moment = require("moment");
import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import { Auction, AuctionItem, Bid, UserInfo } from "../models/models";
import { sendEndAuctionMail } from "../services/mail.service";
import { europeFunctions, store } from "../index";


/** Function executed every morning picks up 30+ days old 
 * auctions and marks them as **archived**  
 * CRON Schedule: At 06:00 on every day-of-week from Sunday through Saturday. */
export const archiveAuctionFunction = europeFunctions.pubsub.schedule('0 6 * * 0-6')
  .timeZone('Europe/Zagreb')
  .onRun(async ctx => {
    
    // Get auctions for today
    const today = () => moment(new Date()).utc();
    
    const auctionsQuery = store.collection('auctions')
    .where('isProcessed', '==', true)
    .endAt(today().subtract(30, 'days').endOf('day').toDate());
    
    const auctionsSnapshot = await auctionsQuery.get();
    let auctions = auctionsSnapshot.docs.map(getDocument) as Auction[];
    
    logger.info(`${auctions.length} processed but not archived auctions found in last 30 days.`);

    for (let auction of auctions) {
        auction.archived = true;
        await store.collection('auctions').doc(auction.id).update(auction);
    }

    logger.info(`${auctions.length} auctions archived`);
  });

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id});



