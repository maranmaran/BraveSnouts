import moment = require("moment");
import { logger } from "firebase-functions";
import { europeFunctions, store } from "../index";
import { Auction } from "../models/models";

/** Function executed every morning picks up 30+ days old 
 * auctions and marks them as **archived**  
 * CRON Schedule: At 06:00 on every day-of-week from Sunday through Saturday. */
export const archiveAuctionFn = europeFunctions.pubsub.schedule('0 6 * * 0-6')
  .timeZone('Europe/Zagreb')
  .onRun(async ctx => {

    try {
      // Get auctions for today
      const today = () => moment(new Date()).utc();

      const auctionsQuery = store.collection('auctions')
        .where('isProcessed', '==', true)
        .orderBy("endDate", "desc")
        .endAt(today().subtract(30, 'days').endOf('day').toDate());

      const auctionsSnapshot = await auctionsQuery.get();
      const auctions = auctionsSnapshot.docs.map(getDocument) as Auction[];

      logger.info(`${auctions.length} processed but not archived auctions found in last 30 days.`);

      for (const auction of auctions) {
        auction.archived = true;
        await store.collection('auctions').doc(auction.id).update(auction as any);
      }

      logger.info(`${auctions.length} auctions archived`);
    } catch (e) {
      logger.error(e);
      throw e;
    }
  });

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id });



