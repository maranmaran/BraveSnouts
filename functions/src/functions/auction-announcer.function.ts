import { logger } from 'firebase-functions';
import { europeFunctions, store } from "..";
import { Auction, User } from "../models/models";
import { sendAuctionAnnouncementMail } from '../services/mail.service';
import moment = require("moment-timezone");

export const announcerFn = europeFunctions.pubsub.schedule('0 10-22 * * *')
    .timeZone('Europe/Zagreb')
    .onRun(async ctx => {

        let startingSoon1Hour = await getStartingSoonAuctions(1, 10);
        let startingSoon24Hours = await getStartingSoonAuctions(24, 10);

        let started = await getStartedAuctions();

        let endingSoon1Hour = await getEndingSoonAuctions(1, 10);
        let endingSoon24Hours = await getEndingSoonAuctions(24, 10);

        if(
            startingSoon1Hour.auctions?.length > 0 || 
            startingSoon24Hours.auctions?.length > 0 || 
            started.auctions?.length > 0 || 
            endingSoon1Hour.auctions?.length > 0 || 
            endingSoon24Hours.auctions?.length > 0 
        ) {
            logger.log("Sending announcements");
            
            // get users to send updates to..
            let users = await getUsers();

            // execute callbacks
            await startingSoon1Hour.callback(users)
            await startingSoon24Hours.callback(users)
            await started.callback(users)
            await endingSoon1Hour.callback(users)
            await endingSoon24Hours.callback(users)
        }
    })

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id });

const today = () => moment(new Date()).utc();

async function getStartingSoonAuctions(hours = 1, minutesWindow = 10) {

    const auctionsQuery = store.collection('auctions')
        .where('startDate', '<=', today().add(hours, 'hours').add(minutesWindow, 'minutes'))
        .where('startDate', '>=', today().add(hours, 'hours').subtract(minutesWindow, 'minutes'))

    const auctionsSnap = await auctionsQuery.get();
    const auctions = auctionsSnap.docs.map(getDocument) as Auction[];

    return {
        auctions, callback: async (users) => {
            for (const auction of auctions) {
                logger.log(`Auction ${auction.name} starts in 1 hour`);
                let startTime = moment(auction.startDate.toDate()).tz("Europe/Zagreb").format("HH:mm");
                let startDate = moment(auction.startDate.toDate()).tz("Europe/Zagreb").format("DD.MM")

                for (const user of users) {
                    await sendAuctionAnnouncementMail(user, auction, "Aukcija uskoro počinje!", `počinje ${startDate} u ${startTime} sati.`)
                }
            }
        }
    }
}

async function getStartedAuctions() {

    const auctionsQuery = store.collection('auctions')
        .where('startDate', '<=', today().add(10, 'minutes'))
        .where('startDate', '>=', today().subtract(10, 'minutes'))

    const auctionsSnap = await auctionsQuery.get();
    const auctions = auctionsSnap.docs.map(getDocument) as Auction[];

    return {
        auctions, callback: async (users) => {
            for (const auction of auctions) {
                logger.log(`Auction ${auction.name} started`);
                let startTime = moment(auction.startDate.toDate()).tz("Europe/Zagreb").format("HH:mm");
                let endTime = moment(auction.endDate.toDate()).tz("Europe/Zagreb").format("HH:mm");
                let endDate = moment(auction.endDate.toDate()).tz("Europe/Zagreb").format("DD.MM")
                for (const user of users) {
                    await sendAuctionAnnouncementMail(user, auction, "Aukcija je počela!", `je počela u ${startTime} sati i završava ${endDate} u ${endTime} sati.`)
                }
            }
        }
    }
}

async function getEndingSoonAuctions(hours = 1, minutesWindow = 10) {

    const auctionsQuery = store.collection('auctions')
        .where('endDate', '<=', today().add(hours, 'hours').add(minutesWindow, 'minutes'))
        .where('endDate', '>=', today().add(hours, 'hours').subtract(minutesWindow, 'minutes'))

    const auctionsSnap = await auctionsQuery.get();
    const auctions = auctionsSnap.docs.map(getDocument) as Auction[];

    return {
        auctions, callback: async (users) => {
            for (const auction of auctions) {
                logger.log(`Auction ${auction.name} ends in ${hours} hours`);

                let endTime = moment(auction.endDate.toDate()).tz("Europe/Zagreb").format("HH:mm");
                let endDate = moment(auction.endDate.toDate()).tz("Europe/Zagreb").format("DD.MM")
                for (const user of users) {
                    await sendAuctionAnnouncementMail(user, auction, "Aukcija uskoro završava!", `završava ${endDate} u ${endTime} sati.`)
                }
            }
        }
    }

}

async function getUsers() {
    const usersQuery = store.collection('users')
        .where('emailSettings.auctionAnnouncements', '==', true);

    const usersSnap = await usersQuery.get();
    const users = usersSnap.docs.map(getDocument) as User[];

    return users;
}

