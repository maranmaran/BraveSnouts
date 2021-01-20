import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import { europeFunctions, store } from "../index";
import { Auction, AuctionItem, Bid, UserInfo } from "../models/models";
import { sendEndAuctionMail } from "../services/mail.service";

/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const endAuctionFn = europeFunctions.https.onCall(
  async (data, context) => {

    const auctionId = data.auctionId;

    try {
      // process auction
      return await auctionEnd(auctionId);
    } 
    catch(error) {
      logger.error(error);
      return { status: 'error', code: 401, message: 'Failed to process auction' }
    }

  }
);

/**Performs actions once auction is finished
 * Checks for today auction and whether or not it's finished
 * If it's done it retrieves all best bids 
 */
const auctionEnd = async (auctionId: string) => {

    // get auction data
    const auction = await getAuction(auctionId);

    // Get auction items data
    // Filter out only items that were bid on
    const items: AuctionItem[] = await getAuctionItems(auctionId);

    // Retrieve bids
    const bids = getBids(items);

    // Retrieve user information
    const userIds = [...(new Set(bids.map(bid => bid.user)))];
    const userInfo = await getUserInformation(userIds);
    
    // Group user bids
    const userBids = getUserBids(bids, userInfo);

    // Save all winning users
    await saveWinners(auctionId, bids);

    // Inform users
    await sendMails(userBids);

    // Mark processed auctions
    await markAuctionProcessed(auction);

    return null;
}

/** Retrieves specific auction data */
const getAuction = async (auctionId: string) => {
    
  const auction = await store.doc(`auctions/${auctionId}`).get();

  if(!auction.exists) {
    throw new Error(`Auction ${auctionId} not found`);
  }

  return { id: auction.id, ...auction.data() } as Auction;
}

/** Retrieves auction items */
const getAuctionItems = async (auctionId: string) => {

  const itemsQuery = store.doc(`auctions/${auctionId}`).collection('items');
  const itemsSnapshot = await itemsQuery.get();
  const items = itemsSnapshot.docs.map(getDocument) as AuctionItem[];

  if(items.length === 0) {
    const message = 'No items found';
    logger.log(message);
    throw new Error(message);
  }

  return items;
} 

/** Reduces auction items and retrieves array of relevant bids */
const getBids = (items: AuctionItem[]) => {
  const bids = items
  .filter(item => item.bid > 0 && item.user)
  .map(item => ({ value: item.bid, user: item.user, item}) as Bid);

  if(bids.length === 0) {
    const message = 'No bids found';
    logger.log(message);
    throw new Error(message);
  }

  return bids;
};

/** Saves winners to winner collection */
const saveWinners = async (auctionId: string, bids: Bid[]) => {
  
  for (const bid of bids) {

    const winner = {
      userId: bid.user,
      auctionId: auctionId,
      itemId: bid.item.id,
      bidId: bid.item.bidId,
    }

    let id = `${winner.auctionId}-${winner.userId}-${winner.itemId}`

    await store.collection('winners').doc(id).set(winner);
  }
}

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
          logger.error(`${error}`);
          throw new Error('User not found');
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
const markAuctionProcessed = async (auction: Auction) => {
    auction.processed = true;
    await store.collection('auctions').doc(auction.id).update(auction);
}

/** Retrieves document data and id in object  */
const getDocument = (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => ({ ...doc.data(), id: doc.id});


