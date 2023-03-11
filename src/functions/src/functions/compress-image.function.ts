import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { europeFunctions } from '../index';
const mkdirp = require('mkdirp');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

export const compressImageFn = europeFunctions.storage.object().onFinalize(async (object, ctx) => {

  try {
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
    const jpegFilePath: string = path.normalize(path.format({ dir: fileDir, name: fileName, ext: '.jpg' }));
    logger.log(jpegFilePath);

    // local system paths for both images where they'll be converted
    const tempFile = path.join(os.tmpdir(), filePath); // original path
    const tempJpegFile = path.join(os.tmpdir(), jpegFilePath); // with .jpg

    // Create the temp directory on local file system where the orginal file will be downloaded.
    await mkdirp(path.dirname(tempFile));

    const bucket = admin.storage().bucket(object.bucket);

    // Download file from bucket to local folder
    await bucket.file(filePath).download({ destination: tempFile });

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
  } catch (e) {
    logger.error(e);
    throw e;
  }


});
