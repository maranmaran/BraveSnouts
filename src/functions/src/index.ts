// initialize
import * as admin from 'firebase-admin';
// dependancies
import * as functions from 'firebase-functions';
import { MailSettingsService } from './functions/auctions/services/mail-settings.service';
admin.initializeApp();

export const store = admin.firestore();
export const config = functions.config();
export const settingsSvc = new MailSettingsService(store);
export const europeFunctions = functions.region('europe-west1');

// eslint-disable-next-line @typescript-eslint/no-floating-promises
// settingsSvc.initialize();

// function exports

// auctions
export const bidChangeFn = require('./functions/auctions/bid-change.function');
export const endAuctionFn = require('./functions/auctions/end-auction.function');
export const changeHandoverFn = require('./functions/auctions/change-handover.function');
export const increaseRaisedMoneyFn = require('./functions/auctions/increase-raised-money.function');
export const exportAuctionFn = require('./functions/auctions/export-auction.function');
export const processAuctionImageFn = require('./functions/auctions/process-auction-image.function');
export const handoverConfirmFn = require('./functions/auctions/handover-confirm.function');
export const sendWinnerMailFn = require('./functions/auctions/send-winner-mail.function');
export const downloadMailsFn = require('./functions/auctions/download-mails.function');
export const testSendWinnerMailFn = require('./functions/auctions/test-send-winner-mail.function');

// blog
export const setBlogPostsFn = require('./functions/blog/set-blog-posts.function');

// store
export const setStoreProductsFn = require('./functions/store/set-store-products.function');

// adopt
export const setAdoptAnimalsFn = require('./functions/adoption/set-adopt-animals.function');

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

// syncs products from stripe to firestore
export const getStoreProducts = setStoreProductsFn;

// syncs blog posts from contentful to firestore
export const getBlogPosts = setBlogPostsFn;

// syncs animals to adopt from contentful to firestore
export const getAdoptAnimals = setAdoptAnimalsFn;

//#endregion

// =====================================================================================================
// ======================================ACTUAL FUNCTION EXPORTS========================================
// =====================================================================================================

//#endregion