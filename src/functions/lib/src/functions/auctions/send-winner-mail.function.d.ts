import { Auction } from './models/models';
export declare const sendWinnerMailFn: import("firebase-functions").HttpsFunction & import("firebase-functions").Runnable<any>;
export declare const getAuctions: (auctionIds: string[]) => Promise<Auction[]>;
