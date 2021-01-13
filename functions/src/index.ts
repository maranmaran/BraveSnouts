import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { AuctionItem, UserInfo } from './models/models';
import { auctionEnd } from './services/auction.service';
import { sendOutbiddedMail } from './services/mail.service';
import * as fs from 'fs';

admin.initializeApp();

export const store = admin.firestore();
export const logger = functions.logger;
export const europeFunctions = functions.region('europe-west1')

/** Logic containing picking up winners of auction
 * Scheduled 5 minutes behind every full hour in a day
 * Checks for ended auctions in past hour and processes them
 */
export const auctionsEndScheduledFunction = europeFunctions.pubsub.schedule('5 0-23 * * *')
  .timeZone('Europe/Zagreb')
  .onRun(async ctx => await auctionEnd());

/** Sends email notification to higher bidder */
export const auctionItemBidChange = europeFunctions.firestore.document("auctions/{auctionId}/items/{itemId}")
  .onUpdate(async (change, ctx) => {
    
    const before = change.before.data() as AuctionItem;
    const after = change.after.data() as AuctionItem;

    if(after.bid === before.bid) {
      logger.warn(`Same value bid of ${after.bid} \n Bid IDs: ${after.bidId} and ${before.bidId}`);
    }
    
    // check if starting price and no bids
    if(!after.user) {
      logger.info(`User id is not present. Before:${before.user} After:${after.user}`);
      return null;
    }

    // check if new bidder
    if (after.user === before.user) {
      logger.warn(`Same bidder`);
      return null;
    }

    // get outbidded user information
    const outbiddedUserData = await admin.auth().getUser(before.user);
    const oubiddedUser: UserInfo = {
      id: before.user,
      name: outbiddedUserData.displayName as string,
      email: outbiddedUserData.email as string,
    };
    
    // send mail template
    // Send to outbidded user information about which item name was outbidded
    // and by how much (previous and new bid value)

    // TODO - send only if user is not present currently on browser (online) 
    await sendOutbiddedMail(oubiddedUser, before, after);

    return null;
  });


const mkdirp = require('mkdirp');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');

export const compressImage = europeFunctions.storage.object().onFinalize(async (object, ctx) => {

  // Exit if this is triggered on a file that is not an image.
  if (!(object.contentType as string).startsWith('image/')) { 
    logger.error('This is not an image.');
    return null;
  }
  
  // Exit if the image is already a JPEG (Compressed).
  if ((object.contentType as string).startsWith('image/jpeg')) {
    logger.warn('Already a JPEG.');
    return null;
  }

  // original file on storage - values
  const filePath = object.name as string;
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath, path.extname(filePath));
  logger.log(fileName);

  // new jpeg file which will be saved to storage
  const jpegFilePath: string = path.normalize(path.format({dir: fileDir, name: fileName, ext: '.jpg' }));
  logger.log(jpegFilePath);

  // local system paths for both images where they'll be converted
  const tempFile = path.join(os.tmpdir(), filePath); // original path
  const tempJpegFile = path.join(os.tmpdir(), jpegFilePath); // with .jpg
  
  // Create the temp directory on local file system where the orginal file will be downloaded.
  await mkdirp(path.dirname(tempFile));
  
  const bucket = admin.storage().bucket(object.bucket);
  
  // Download file from bucket to local folder
  await bucket.file(filePath).download({destination: tempFile});

  // Convert the image to jpeg using ImageMagick locally.
  await spawn('convert', [
    '-strip', 
    '-interlace', 'Plane', 
    '-gaussian-blur', '0.05', 
    '-quality', '1', 
    '-compress', 'JPEG', 
    tempFile, 
    tempJpegFile, 
  ]);

  // Uploading the JPEG image to storage
  await bucket.upload(tempJpegFile, { destination: jpegFilePath, contentType: 'image/jpeg' });
  // Uploading the JPEG image to storage
  // await bucket.file(filePath).delete();

  // // Once the image has been converted delete the local files to free up disk space.
  fs.unlinkSync(tempFile);
  fs.unlinkSync(tempJpegFile);

  logger.info('Image compressed and is located at ', jpegFilePath)
  return null;
});

