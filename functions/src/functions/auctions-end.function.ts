import moment = require("moment");
import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import { Auction, AuctionItem, Bid, UserInfo } from "../models/models";
import { sendEndAuctionMail } from "../services/mail.service";
import { europeFunctions, store } from "../index";

/** Logic containing picking up winners of auction
 * Scheduled 5 minutes behind every full hour in a day
 * Checks for ended auctions in past hour and processes them
 */
export const auctionsEndScheduledFunction = europeFunctions.pubsub.schedule('5 0-23 * * *')
  .timeZone('Europe/Zagreb')
  .onRun(async ctx => await auctionEnd());

/**Performs actions once auction is finished
 * Checks for today auction and whether or not it's finished
 * If it's done it retrieves all best bids 
 */
const auctionEnd = async () => {

    // get auctions
    const auctions = await getAuctions();
    if(auctions.length === 0) {
        logger.log('No auctions found');
        return null;
    }

    // Get all auction items
    // filter out only items that were bid on
    const items: AuctionItem[] = await getAllItems(auctions);
    if(items.length === 0) {
        logger.log('No items found');
        return null;
    }

    // Retrieve bids
    const bids = getBids(items);
    if(bids.length === 0) {
        logger.log('No bids found');
        return null;
    }

    // Retrieve user information
    const userIds = [...(new Set(bids.map(bid => bid.user)))];
    const userInfo = await getUserInformation(userIds);
    
    // Group user bids
    const userBids = getUserBids(bids, userInfo);

    // Inform users
    await sendMails(userBids);

    // Mark processed auctions
    await markAuctionsProcessed(auctions);

    return null;
}

/** Retrieves relevant auctions if there are any */
const getAuctions = async () => {
    
  // Get auctions for today
  const today = () => moment(new Date()).utc();
  
  logger.log(`Check time is ${today()}`);
  
  const auctionsQuery = store.collection('auctions')
  .orderBy('endDate')
  .startAt(today().startOf('day').toDate())
  .endAt(today().endOf('day').toDate());
  
  const auctionsSnapshot = await auctionsQuery.get();
  let auctions = auctionsSnapshot.docs.map(getDocument) as Auction[];
  
  // Filter out processed auctions 
  // Take only finished ones (finished between NOW and 1 hour ago)
  const inPastHour = (date: Date) => moment(date).isBetween(today().subtract(1 , 'hour'), today());
  auctions = auctions.filter(auction => !auction.processed && inPastHour(auction.endDate.toDate()));

  console.log(`${auctions.length} in past 1 hour`);
  
  return auctions;
}

/** Retrieves items for array of auctions */
const getAllItems = async (auctions: Auction[]) => {
  let items: AuctionItem[] = [];

  for await (const auction of auctions) {
      const itemsArr = await getAuctionItems(auction.id);
      items = [...items, ...itemsArr];
  }

  items = items.filter(item => !!item.user && item.user.trim() !== '');

  return items;
}

/** Retrieves auction items */
const getAuctionItems = async (auctionId: string) => {

  const itemsQuery = store.doc(`auctions/${auctionId}`).collection('items');
  const itemsSnapshot = await itemsQuery.get();
  const items = itemsSnapshot.docs.map(getDocument) as AuctionItem[];

  return items;
} 

/** Reduces auction items and retrieves array of relevant bids */
const getBids = (items: AuctionItem[]) => {
  return items.map(item => ({ value: item.bid, user: item.user, item}) as Bid);
};

/** Retrieves authenticated users information (Email, Name ..etc) */
const getUserInformation = async (userIds: string[]) => {
  const userInfoMap = new Map<string, UserInfo>();

  for await (const userId of userIds) {
      try {

          const user = await admin.auth().getUser(userId);
          userInfoMap.set(userId, {
              id: userId, 
              name: user.displayName as string, 
              email: user.email as string,
          });

      } catch (error) {
          logger.log(`User not found ${error}`);
      }
  }

  // do work
  return userInfoMap;
}

/** Retrieves users bid grouped and returns a Map for O(1) access */
const getUserBids = (bids: Bid[], userInfoMap: Map<string, UserInfo>): Map<UserInfo, Bid[]> => {
  const userBidsMap = new Map<UserInfo, Bid[]>();

  userInfoMap.forEach(info => {
      const userBids = bids.filter(bid => bid.user === info.id);

      userBidsMap.set(info, userBids);
  });

  return userBidsMap;
}

/** Sends mails to relevant users with their won items */
const sendMails = async (userBids: Map<UserInfo, Bid[]>) => {
  for (const [userInfo, bids] of userBids) {
      await sendEndAuctionMail(userInfo, bids);
  }
}

/** Marks all auctions as processed */
const markAuctionsProcessed = async (auctions: Auction[]) => {
  for (const auction of auctions) {
      auction.processed = true;

      await store.collection('auctions').doc(auction.id).update(auction);
  }
}

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id});


