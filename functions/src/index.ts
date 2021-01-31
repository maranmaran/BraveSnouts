// initialize
import * as admin from 'firebase-admin';
admin.initializeApp();

// dependancies
import * as functions from 'firebase-functions';
export const store = admin.firestore();
export const europeFunctions = functions.region('europe-west1');
export const config = functions.config();
export const firebaseAdmin = admin;

// function exports
const bidChangeFn = require('./functions/bid-change.function');
const endAuctionFn = require('./functions/end-auction.function');
const archiveAuctionFn = require('./functions/archive-auction.function');
const instagramLoginFns = require('./functions/instagram-login.function');
// import * as compressImageFunction from './functions/compress-image.function';

export const bidChange = bidChangeFn;
export const endAuction = endAuctionFn;
export const archiveAuction = archiveAuctionFn;
export const instagramLogin = instagramLoginFns;
// export const compressImage = compressImageFunction;



