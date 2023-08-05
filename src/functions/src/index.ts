// initialize
import * as admin from 'firebase-admin';
// dependancies
import * as functions from 'firebase-functions';
import { MailSettingsService } from './services/mail-settings.service';
admin.initializeApp();

export const store = admin.firestore();
export const config = functions.config();
export const settingsSvc = new MailSettingsService(store);
export const europeFunctions = functions.region('europe-west1');

// eslint-disable-next-line @typescript-eslint/no-floating-promises
// settingsSvc.initialize();

// function exports
const bidChangeFn = require('./functions/bid-change.function');
const endAuctionFn = require('./functions/end-auction.function');
const changeHandoverFn = require('./functions/change-handover.function');
const increaseRaisedMoneyFn = require('./functions/increase-raised-money.function');
const exportAuctionFn = require('./functions/export-auction.function');
const processAuctionImageFn = require('./functions/process-auction-image.function');
const handoverConfirmFn = require('./functions/handover-confirm.function');
const sendWinnerMailFn = require('./functions/send-winner-mail.function');
const testSendWinnerMailFn = require('./functions/test-send-winner-mail.function');
const downloadMailsFn = require('./functions/download-mails.function');
const getProductsFn = require('./functions/stripe/stripe.functions');
const getPriceFn = require('./functions/stripe/stripe.functions');

//#region 

// =====================================================================================================
// ======================================ACTUAL FUNCTION EXPORTS========================================
// =====================================================================================================

//#region Executed frequently

// send email notification to users that they have been outbidded
export const bidChange = bidChangeFn;

// increments raised money on auction whenever bid passes
export const increaseRaisedMoney = increaseRaisedMoneyFn;

//#endregion

//#region Executed infrequently

// processes auction for END
// collects user data and bids 
// writes winners to AUCITON and individual ITEMS
// send mail to everyone as notification
// marks auction as processed
export const endAuction = endAuctionFn;
export const sendWinnerMail = sendWinnerMailFn;
export const testSendWinnerMail = testSendWinnerMailFn;

// sends email notification to users that handover has changed
// updates auction data for handover in store
export const changeHandover = changeHandoverFn;
// send handover confirmation mail (for post and in person)
export const handoverConfirm = handoverConfirmFn;

// processes auction images from temp storage and creates auction items
// NOTE: This one is memory, cpu and time intensive
// Further optimizations can be made if everything was processed 
// beforehand with script and just saved in storage...
// export const processAuctionImages = processAuctionImagesFn;
export const processAuctionImage = processAuctionImageFn;

// downloads all users emails whoa re subscribed to announcements 
export const downloadMails = downloadMailsFn;

// exports auction details, winners and donations 
export const exportAuction = exportAuctionFn;

// Stripe functions
export const getProducts = getProductsFn; // gets list of active products
export const getPrice = getPriceFn; // gets specific pricing details

//#endregion

// =====================================================================================================
// ======================================ACTUAL FUNCTION EXPORTS========================================
// =====================================================================================================

//#endregion

