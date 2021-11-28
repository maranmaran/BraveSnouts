import * as firebase from "firebase-admin";
import { logger } from "firebase-functions";
import { europeFunctions, store } from "../index";
import {
  Auction,
  AuctionItem,
  EmailSettings,
  User,
  UserInfo
} from "../models/models";
import { sendOutbiddedMail } from "../services/mail.service";

/** Sends email notification to higher bidder */
export const bidChangeFn = europeFunctions.firestore
  .document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {

    try {
      const before = change.before.data() as AuctionItem;
      const after = change.after.data() as AuctionItem;

      const auction = (await (
        await store.collection("auctions").doc(before.auctionId).get()
      ).data()) as Auction;

      if (
        auction.endDate.seconds <
        firebase.firestore.Timestamp.fromDate(new Date()).seconds
      ) {
        logger.info(`Auction ended`);
        return null;
      }

      logger.info(`Before BidId: ${before.bidId} - After BidId: ${after.bidId}`);

      if (!after.user || !before.user) {
        logger.info(
          `User id is not present. Before:${before.user} After:${after.user}`
        );
        return null;
      }

      if (after.bid === before.bid) {
        logger.warn(
          `Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`
        );
        return null;
      }

      if (after.bid < before.bid) {
        logger.warn(
          `Lesser value bid of ${after.bid} < ${before.bid}. Bid IDs: after: ${after.bidId} and before: ${before.bidId}`
        );
        return null;
      }

      if (after.user === before.user) {
        logger.warn(`Same bidder`);
        return null;
      }

      // check permission
      const userEmailSettings = (
        (await store.collection("users").doc(before.user).get()).data()
          ?.emailSettings as EmailSettings
      )?.bidUpdates;
      if (!userEmailSettings) {
        logger.warn(
          `Didn't send bid update to user because he either opted out or was not found. ${before.user}`
        );
      }

      // get outbidded user information
      const outbiddedUserData = (await (
        await store.collection("users").doc(before.user).get()
      ).data()) as User;
      if (!outbiddedUserData) {
        logger.error("Can not find user");
      }

      const oubiddedUser: UserInfo = {
        id: before.user,
        name: outbiddedUserData.displayName as string,
        email: outbiddedUserData.email as string,
        phoneNumber: outbiddedUserData.phoneNumber,
      };

      // send mail template
      // Send to outbidded user information about which item name was outbidded
      // and by how much (previous and new bid value)

      if (outbiddedUserData?.emailSettings?.bidUpdates) {
        // TODO - send only if user is not present currently on browser (online)
        await sendOutbiddedMail(oubiddedUser, before, after);
      } else {
        logger.warn("User chose to opt out");
      }

      return null;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  });
