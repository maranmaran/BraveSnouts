import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { auctionsEndScheduledFunction as auctionsEndFunction } from './functions/auctions-end.function';
import { auctionItemBidChange as bidChangeFunction } from './functions/bid-change.function';
import { compressImageFunction } from './functions/compress-image.function';

// initialize
admin.initializeApp();

// dependancies
export const store = admin.firestore();
export const europeFunctions = functions.region('europe-west1');
export const config = functions.config();

// functions
// export const auctionsEnd = auctionsEndFunction;
//export const bidChange = bidChangeFunction;
// export const compressImage = compressImageFunction;



