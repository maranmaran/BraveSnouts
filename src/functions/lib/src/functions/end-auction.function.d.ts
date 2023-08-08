import { Auction, AuctionItem, Bid, UserInfo } from "../models/models";
/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export declare const endAuctionFn: import("firebase-functions").HttpsFunction & import("firebase-functions").Runnable<any>;
/** Retrieves specific auction data */
export declare const getAuction: (auctionId: string) => Promise<Auction>;
/** Retrieves auction items */
export declare const getAuctionItems: (auctionId: string) => Promise<AuctionItem[]>;
/** Reduces auction items and retrieves array of relevant bids */
export declare const getBids: (items: AuctionItem[]) => Bid[];
/** Retrieves authenticated users information (Email, Name ..etc) */
export declare const getUserInformation: (userIds: string[]) => Promise<Map<string, UserInfo>>;
/** Retrieves users bid grouped and returns a Map for O(1) access */
export declare const getUserBidsMap: (bids: Bid[], userInfoMap: Map<string, UserInfo>) => Map<UserInfo, Bid[]>;
