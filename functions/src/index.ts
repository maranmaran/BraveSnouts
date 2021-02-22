// initialize
import * as admin from 'firebase-admin';
// dependancies
import * as functions from 'firebase-functions';
admin.initializeApp();

export const store = admin.firestore();
export const europeFunctions = functions.region('europe-west1');
export const config = functions.config();

// function exports
const bidChangeFn = require('./functions/bid-change.function');
const endAuctionFn = require('./functions/end-auction.function');
// const archiveAuctionFn = require('./functions/archive-auction.function');
const changeHandoverFn = require('./functions/change-handover.function');
const bidChangeEmailOptOutFn = require('./functions/bid-change-email-optout.function');

//#region 

// =====================================================================================================
// ======================================ACTUAL FUNCTION EXPORTS========================================
// =====================================================================================================

// send email notification to users that they have been outbidded
export const bidChange = bidChangeFn;

// processes auction for END
// collects user data and bids 
// writes winners to AUCITON and individual ITEMS
// send mail to everyone as notification
// marks auction as processed
export const endAuction = endAuctionFn;

// sends email notification to users that handover has changed
// updates auction data for handover in store
export const changeHandover = changeHandoverFn;

// export const archiveAuction = archiveAuctionFn;
// export const bidChangeEmailOptOut = bidChangeEmailOptOutFn;


// =====================================================================================================
// ======================================ACTUAL FUNCTION EXPORTS========================================
// =====================================================================================================

//#endregion

