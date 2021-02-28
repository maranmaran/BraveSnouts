import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import { europeFunctions, store } from "../index";
import { Auction, AuctionItem, Bid, TrackedItem, UserInfo } from "../models/models";
import { sendEndAuctionMail } from "../services/mail.service";

/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const endAuctionFn = europeFunctions.https.onCall(
  async (data, context) => {

    const auctionId = data.auctionId;
    const handoverDetails = data.handoverDetails;

    // process auction
    return await auctionEnd(auctionId, handoverDetails);
  }
);

/**Performs actions once auction is finished
 * Checks for today auction and whether or not it's finished
 * If it's done it retrieves all best bids 
 */
const auctionEnd = async (auctionId: string, handoverDetails: string[]) => {

    // get auction data
    console.info("Retrieving auction")
    const auction = await getAuction(auctionId);

    // Get auction items data
    // Filter out only items that were bid on
    console.info("Retrieving items")
    const items: AuctionItem[] = await getAuctionItems(auctionId);

    // Retrieve bids
    console.info("Retrieving bids")
    const bids = getBids(items);

    // Retrieve user information
    console.info("Retrieving user information")
    const userIds = [...(new Set(bids.map(bid => bid.user)))];
    const userInfo = await getUserInformation(userIds);
    
    // Group user bids
    const userBids = getUserBids(bids, userInfo);

    // Save all winning users
    console.info("Saving bids")
    await saveWinners(auctionId, bids, userInfo);

    // clear tracked items
    console.info("Deleting tracked items")
    await clearTrackedItems(auctionId);

    // Inform users
    console.info("Sending emails")
    console.error("Uncomment to actually send emails")
    // await sendMails(auction, userBids, handoverDetails);

    // Mark processed auctions
    console.info("Update auction as processed")
    await updateAuction(auction, handoverDetails);

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
  const items = itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id})) as AuctionItem[];

  if(items.length === 0) {
    const message = 'No items found';
    logger.warn(message);
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
    logger.warn(message);
    throw new Error(message);
  }

  return bids;
};

/** Saves winners to winner collection */
const saveWinners = async (auctionId: string, bids: Bid[], userInfo: Map<string, UserInfo>) => {
  
  for (const bid of bids) {

    if(!userInfo.has(bid.user)) {
      // skip
      console.warn(`Skipping ${bid.user}`)
      continue;
    }
    const user = userInfo.get(bid.user) as UserInfo;

    const winnerInstance = {
      userId: user.id,
      auctionId: auctionId,
      itemId: bid.item.id,
      bidId: bid.item.bidId,
      
      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      
      paymentStatus: 'pending',
      deliveryChoice: null,
      postalInformation: null,

    }
    
    // const id = `${winner.auctionId}-${winner.userId}-${winner.itemId}`

    const winnerObj = Object.assign({}, winnerInstance);

    await store.collection(`auctions/${auctionId}/items`).doc(winnerObj.itemId).update(Object.assign({}, { winner: winnerObj } ));
  }
}

/** Clears all user tracked items for processed auction */
const clearTrackedItems = async (auctionId: string) => {
  const trackedItems = await store.collectionGroup("tracked-items").where("auctionId", "==", auctionId).get();
  for(const item of trackedItems.docs) {
    const trackedItem = item.data() as TrackedItem;
    console.info(`users/${trackedItem.userId}/tracked-items/${item.id}`);
    await store.doc(`users/${trackedItem.userId}/tracked-items/${item.id}`).delete();
  }
}

/** Retrieves authenticated users information (Email, Name ..etc) */
const getUserInformation = async (userIds: string[]) => {
  const userInfoMap = new Map<string, UserInfo>();

  for await (const userId of userIds) {
      try {

          const user = await admin.auth().getUser(userId);

          const userDb = await (await store.doc(`users/${user.uid}`).get()).data();

          userInfoMap.set(userId, {
              id: user.uid, 
              name: userDb.displayName, 
              email: userDb.email,
          });

      } catch (error) {
          logger.error(`${error}`);
          console.warn(`User not found ${userId}`);
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
const sendMails = async (auction: Auction, userBids: Map<UserInfo, Bid[]>, handoverDetails: string[]) => {
  for (const [userInfo, bids] of userBids) {
      await sendEndAuctionMail(auction, handoverDetails, userInfo, bids);
  }
}

/** Marks all auctions as processed */
const updateAuction = async (auction: Auction, handoverDetails: string[]) => {
    auction.processed = true;
    auction.handoverDetails = handoverDetails;
    await store.collection('auctions').doc(auction.id).set(auction, { merge: true });
}



