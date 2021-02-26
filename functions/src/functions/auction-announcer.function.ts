import { logger } from 'firebase-functions';
import { europeFunctions, store } from "..";
import { Auction } from "../models/models";
import moment = require("moment");

/** Function executed every morning picks up 30+ days old 
 * auctions and marks them as **archived**  
 * CRON Schedule: At 06:00 on every day-of-week from Sunday through Saturday. */
export const archiveAuctionFn = europeFunctions.pubsub.schedule('0 6 * * 0-6')
.timeZone('Europe/Zagreb')
.onRun(async ctx => {

    // get auctions 
    // <---1day----NOW----1day---> 
    // timeframe

     // Get auctions for today
     const today = () => moment(new Date()).utc();
     const tomorrow = today().add(1, 'days').endOf('day');
    
     const auctionStartQuery = store.collection('auctions')
     .where('startDate', '>=', today)
     .where('startDate', '<=', tomorrow)
     .orderBy('startDate');

     const startingAuctionsSnap = await auctionStartQuery.get();
     const startingAuctions = startingAuctionsSnap.docs.map(getDocument) as Auction[];
     
     const auctionEndQuery = store.collection('auctions')
     .where('endDate', '>=', today)
     .where('endtDate', '<=', tomorrow)
     .orderBy('endDate');
     
     const endingAuctionsSnap = await auctionEndQuery.get();
     const endingAuctions = endingAuctionsSnap.docs.map(getDocument) as Auction[];
     
    // inform users with emails enabled if 
    
    for(const auction of startingAuctions) {
        const duration = moment.duration(moment(auction.startDate.toDate()).diff(today()));
        const hours = duration.asHours();
        
        logger.log(`Auction ${auction.id} with start ${auction.startDate} duration in hours ${hours}`);
        
        // if auction starts in 24 hours
        if(hours === 24) {
            logger.log(`starting in 24 hours`);
        }
        // if auction starts in 1 hour
        if(hours === 1) {
            logger.log(`starting in 1 hour`);
        }
    }
    
    for(const auction of endingAuctions) {
        const duration = moment.duration(moment(auction.endDate.toDate()).diff(today()));
        const hours = duration.asHours();
        
        logger.log(`Auction ${auction.id} with end ${auction.endDate} duration in hours ${hours}`);
        
        // if auction ends in 1 hour
        if(hours === 24) {
            logger.log(`ending in 24 hours`);
        }
        // if auction ends in 24 hours
        if(hours === 1) {
            logger.log(`ending in 1 hour`);
        }
    }
})

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id});
