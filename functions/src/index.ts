// initialize
import * as admin from 'firebase-admin';
admin.initializeApp();

// dependancies
import * as functions from 'firebase-functions';
export const store = admin.firestore();
export const europeFunctions = functions.region('europe-west1');
export const config = functions.config();

// function exports
import * as bidChangeFunction from './functions/bid-change.function';
import * as auctionsEndFunction from './functions/auctions-end.function';
import * as compressImageFunction from './functions/compress-image.function';
import * as archiveAuctionFunction from './functions/archive-auction.function';

export const bidChange = bidChangeFunction;
export const auctionsEnd = auctionsEndFunction;
export const archiveAuction = archiveAuctionFunction;
// export const compressImage = compressImageFunction;



