import { logger } from 'firebase-functions';
import { europeFunctions, store } from "..";
import { Auction, User } from "../models/models";
import { sendAuctionEndingAnnouncementMail, sendAuctionStartingAnnouncementMail } from './../services/mail.service';
import moment = require("moment");

export const auctionAnnouncerFN = europeFunctions.pubsub.schedule('5 10-22 * * *')
    .timeZone('Europe/Zagreb')
    .onRun(async ctx => {

        const futureAuctions = await getFutureAuctions();
        const activeAuctions = await getActiveAuctions();
        const users = await getUsers(futureAuctions?.length + activeAuctions?.length);
        if (users?.length == 0) {
            logger.warn('No users to send data to');
            return;
        }

        // inform users with emails enabled if 
        for (const auction of futureAuctions) {

            const duration = moment.duration(moment(auction.startDate.toDate()).diff(today()));
            const hours = duration.asHours();

            logger.log(`Auction ${auction.id} with start ${auction.startDate} duration in hours ${hours}`);

            // if auction starts in 24 hours
            // if (hours === 24) {
            //     logger.log(`starting in 24 hours`);
            //     for (const user of users) {
            //         sendAuctionEndingAnnouncementMail(user, auction, "1 dan")
            //     }
            // }

            // if auction starts in 1 hour
            if (hours === 1) {
                logger.log(`starting in 1 hour`);
                for (const user of users) {
                    sendAuctionStartingAnnouncementMail(user, auction, "1 sat")
                }
            }
        }

        for (const auction of activeAuctions) {
            const duration = moment.duration(moment(auction.endDate.toDate()).diff(today()));
            const hours = duration.asHours();

            logger.log(`Auction ${auction.id} with end ${auction.endDate} duration in hours ${hours}`);

            // if auction ends in 1 hour
            // if (hours === 24) {
            //     logger.log(`ending in 24 hours`);
            // }
            // if auction ends in 24 hours
            if (hours === 1) {
                logger.log(`ending in 1 hour`);
                for (const user of users) {
                    sendAuctionEndingAnnouncementMail(user, auction, "1 sat")
                }
            }
        }
    })

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id });

const today = () => moment(new Date()).utc();

async function getFutureAuctions() {
    // get auctions 
    // <---1day----NOW----1day---> 
    // timeframe

    // Get auctions for today
    const tomorrow = today().add(1, 'days').endOf('day');

    const auctionStartQuery = store.collection('auctions')
        .where('startDate', '>=', today())
        .where('startDate', '<=', tomorrow)
        .orderBy('startDate');

    const startingAuctionsSnap = await auctionStartQuery.get();
    const startingAuctions = startingAuctionsSnap.docs.map(getDocument) as Auction[];

    return startingAuctions.filter(a => getAuctionState(a) == 'future');
}

async function getActiveAuctions() {
    // Get auctions for today
    const tomorrow = today().add(1, 'days').endOf('day');

    const auctionEndQuery = store.collection('auctions')
        .where('endDate', '>=', today())
        .where('endtDate', '<=', tomorrow)
        .orderBy('endDate');

    const endingAuctionsSnap = await auctionEndQuery.get();
    const endingAuctions = endingAuctionsSnap.docs.map(getDocument) as Auction[];

    return endingAuctions.filter(a => getAuctionState(a) == 'active');
}

async function getUsers(auctionsLength: number) {
    if (auctionsLength == 0) {
        return [];
    }

    const usersQuery = store.collection('users')
        .where('emailSettings.auctionAnnouncements', '==', true);

    const usersSnap = await usersQuery.get();
    const users = usersSnap.docs.map(getDocument) as User[];

    return users;
}

export function getAuctionState(auction: Auction): 'future' | 'active' | 'expired' {

    let state: 'future' | 'active' | 'expired' = 'active';

    if (isFutureAuction(auction)) {
        state = 'future'
    }

    if (isExpiredAuction(auction)) {
        state = 'expired'
    }

    return state;
}

/**Auction that is set in future and is yet to come */
function isFutureAuction(auction: Auction) {
    return moment(auction.startDate.toDate()).isAfter(new Date());
}

/**Auction that has ended and/or is processed by firebase function*/
function isExpiredAuction(auction: Auction) {
    return (moment(auction.endDate.toDate()).isBefore(new Date()) || auction.processed) && !isFutureAuction(auction);
}

