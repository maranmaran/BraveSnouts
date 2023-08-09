import * as functions from 'firebase-functions';
import { logger } from "firebase-functions";
import { store } from "../app";
import { Auction, AuctionItem, Bid, TrackedItem, UserInfo, WinnerOnAuction } from "./models/models";

/** 
 * Processes auctions end
 * Writes winners to DB
 */
export const endAuctionFn = functions.region('europe-west1').https.onCall(
  async (data, context) => {

    try {
      const auctionId = data.auctionId;
      const handoverDetails = data.handoverDetails;

      // process auction
      return await auctionEnd(auctionId, handoverDetails);
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }
);

/**Performs actions once auction is finished
 * Checks for today auction and whether or not it's finished
 * If it's done it retrieves all best bids 
 */
const auctionEnd = async (auctionId: string, handoverDetails: string[]) => {

  // get auction data
  logger.info("Retrieving auction")
  const auction = await getAuction(auctionId);

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
  const userBids = getUserBidsMap(bids, userInfo);

  // Save all winning users
  logger.info("Saving winners")
  await saveWinners(auctionId, userBids);

  // clear tracked items
  logger.info("Deleting tracked items")
  await clearTrackedItems(auctionId);

  // Mark processed auctions
  logger.info("Update auction as processed")
  await updateAuction(auction, handoverDetails);

  return null;
}

/** Retrieves specific auction data */
export const getAuction = async (auctionId: string) => {

  const auction = await store.doc(`auctions/${auctionId}`).get();

  if (!auction.exists) {
    throw new Error(`Auction ${auctionId} not found`);
  }

  return { id: auction.id, ...auction.data() } as Auction;
}

/** Retrieves auction items */
export const getAuctionItems = async (auctionId: string) => {

  const itemsQuery = store.doc(`auctions/${auctionId}`).collection('items');
  const itemsSnapshot = await itemsQuery.get();
  const items = itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AuctionItem[];

  if (items.length === 0) {
    const message = 'No items found';
    logger.warn(message);
    throw new Error(message);
  }

  return items;
}

/** Reduces auction items and retrieves array of relevant bids */
export const getBids = (items: AuctionItem[]) => {
  const bids = items
    .filter(item => item.bid > 0 && item.user)
    .map(item => ({ value: item.bid, user: item.user, item }) as Bid);

  if (bids?.length === 0) {
    const message = 'No bids found';
    logger.warn(message);
  }

  return bids ?? [];
};

/** Retrieves authenticated users information (Email, Name ..etc) */
export const getUserInformation = async (userIds: string[]) => {
  const userInfoMap = new Map<string, UserInfo>();

  for await (const userId of userIds) {
    try {

      if (userInfoMap.has(userId)) {
        // already seen
        continue;
      }

      // add to map
      const userDb = await (await store.doc(`users/${userId}`).get()).data();

      userInfoMap.set(userId, {
        id: userId,
        name: userDb.displayName,
        email: userDb.email,
        phoneNumber: userDb.phoneNumber,
        endAuctionMailSent: userDb.endAuctionMailSent
      });

    } catch (error) {
      logger.error(`${error}`);
      logger.warn(`User not found ${userId}`);
    }
  }

  // do work
  return userInfoMap;
}

/** Retrieves users bid grouped and returns a Map for O(1) access */
export const getUserBidsMap = (bids: Bid[], userInfoMap: Map<string, UserInfo>): Map<UserInfo, Bid[]> => {
  const userBidsMap = new Map<UserInfo, Bid[]>();

  userInfoMap.forEach(info => {
    const userBids = bids.filter(bid => bid.user === info.id);

    userBidsMap.set(info, userBids);
  });

  return userBidsMap;
}

/** Saves winners to winner collection */
const saveWinners = async (auctionId: string, userBids: Map<UserInfo, Bid[]>) => {

  // write to winners collection from Auction

  for await (const [user, bids] of userBids) {

    const winner = Object.assign({}, new WinnerOnAuction({
      id: user.id,

      auctionId: auctionId,
      items: bids.map(b => b.item),
      bids: bids,

      userInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      },

      paymentStatus: 'pending',
      deliveryChoice: null,
      postalInformation: null,
    })
    );

    await store.doc(`auctions/${auctionId}/winners/${winner.id}`).set(winner);

    // update each item for winner details
    for await (const bid of bids) {

      const winnerInstance = {
        userId: user.id,
        auctionId: auctionId,
        itemId: bid.item.id,
        bidId: bid.item.bidId,

        userInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber
        },

        paymentStatus: 'pending',
        deliveryChoice: null,
        postalInformation: null,
      }

      await store.collection(`auctions/${auctionId}/items`).doc(winnerInstance.itemId).update(Object.assign({}, { winner: winnerInstance }));
    }

  }
}

/** Clears all user tracked items for processed auction */
const clearTrackedItems = async (auctionId: string) => {
  const trackedItems = await store.collectionGroup("tracked-items").where("auctionId", "==", auctionId).get();
  for (const item of trackedItems.docs) {
    const trackedItem = item.data() as TrackedItem;
    logger.info(`users/${trackedItem.userId}/tracked-items/${item.id}`);
    await store.doc(`users/${trackedItem.userId}/tracked-items/${item.id}`).delete();
  }
}

/** Marks all auctions as processed */
const updateAuction = async (auction: Auction, handoverDetails: string[]) => {
  auction.processed = true;
  auction.handoverDetails = handoverDetails;
  await store.collection('auctions').doc(auction.id).set(auction, { merge: true });
}



