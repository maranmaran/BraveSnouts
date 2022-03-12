import { logger } from 'firebase-functions';
import { europeFunctions, store } from '..';
import { Auction, AuctionItem, Bid, UserInfo } from '../models/models';
import { sendEndAuctionMail } from '../services/mail.service';
import { getAuction, getAuctionItems, getBids, getUserBidsMap, getUserInformation } from './end-auction.function';
/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const sendWinnerMailFn = europeFunctions.https.onCall(
    async (data, context) => {

        try {
            const auctionIds = data.auctionIds as string[];
            const handoverDetails = data.handoverDetails;

            const auctions = await getAuctions(auctionIds);
            const userBids = await getAllAuctionUserBidsMap(auctionIds);

            const userBidsTransformed = new Map<UserInfo, Bid[]>();
            for (const [_, val] of userBids) {
                userBidsTransformed.set(val.user, val.bids);
            }

            logger.info("Sending emails")
            // logger.error("Uncomment send mails to actually send mails");
            await sendMails(auctions, userBidsTransformed, handoverDetails);

            return null;

        } catch (e) {
            logger.error(e);
            throw e;
        }
    }
);

const getAuctions = async (auctionIds: string[]) => {
    let auctions: Auction[] = [];
    for (const auctionId of auctionIds) {
        auctions.push(await getAuction(auctionId));
    }

    return auctions;
}

const getAllAuctionUserBidsMap = async (auctionIds: string[]) => {
    const allAuctionUserBidsMap = new Map<string, { user: UserInfo, bids: Bid[] }>();
    for (const auctionId of auctionIds) {
        // Get auction items data
        // Filter out only items that were bid on
        logger.info("Retrieving items")
        const items: AuctionItem[] = await getAuctionItems(auctionId);

        // Retrieve bids
        logger.info("Retrieving bids")
        const bids = getBids(items);

        // Retrieve user information
        logger.info("Retrieving user information")
        const userIds = [...(new Set(bids.map(bid => bid.user)))];
        const userInfo = await getUserInformation(userIds);

        // Group user bids
        const userBidsMap = getUserBidsMap(bids, userInfo);

        for (const [key, value] of userBidsMap) {
            if (allAuctionUserBidsMap.has(key.id)) {
                allAuctionUserBidsMap.set(
                    key.id,
                    { user: key, bids: [...allAuctionUserBidsMap.get(key.id).bids, ...value] }
                )
            } else {
                allAuctionUserBidsMap.set(key.id, { user: key, bids: value });
            }
        }
    }

    return allAuctionUserBidsMap;
}

/** Sends mails to relevant users with their won items */
const sendMails = async (auctions: Auction[], userBids: Map<UserInfo, Bid[]>, handoverDetails: string[]) => {

    let sentMailsCounter = 0;
    let skippedCounter = 0;

    let sendMailJobs: Promise<void>[] = [];
    for (const [userInfo, bids] of userBids) {

        if (userInfo.endAuctionMailSent == true) {
            skippedCounter++;
            continue;
        }

        // buffer
        if (sendMailJobs.length == 10) {
            await Promise.all(sendMailJobs);
            sendMailJobs = [];
        }

        sendMailJobs.push(new Promise<void>(async (res, err) => {
            await sendEndAuctionMail(auctions, handoverDetails, userInfo, bids);
            await store.doc(`users/${userInfo.id}`).update({ endAuctionMailSent: true })
            sentMailsCounter++;
            res();
        }))
    }
    await Promise.all(sendMailJobs);

    logger.info(`Sent ${sentMailsCounter} mails out of ${userBids.size}.`);

    if (sentMailsCounter == userBids.size ||
        sentMailsCounter == 0 ||
        sentMailsCounter + skippedCounter == userBids.size) {

        for (const [userInfo, _] of userBids) {
            await store.doc(`users/${userInfo.id}`).update({ endAuctionMailSent: false })
        }

        logger.info(`Reverted endAuctionMailSent flag`);
    }

}