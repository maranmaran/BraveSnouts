import * as admin from 'firebase-admin';
import { RuntimeOptions, logger } from 'firebase-functions';
import { mkdirp } from 'mkdirp';
import { v4 as uuidv4 } from 'uuid';
import { europeFunctions, store } from '../app';

const sharp = require('sharp');
const path = require('path');
const os = require('os');

// TODO: Deprecate some settings
interface ImageProcessingSettings {
    compress: boolean;
    compressQuality: number;
    compressResizeHeight: number;
    compressResizeWidth: number;
    compressMethod: string;
    compressExtension: string; enableProdMode
}

const runtimeOpts: Partial<RuntimeOptions> = {
    timeoutSeconds: 540,
    memory: "1GB"
}

// Processes newly added images and creates
// Original, Compressed, Thumbnail versions of image in storage
// Links are created in advance by Client
export const processImageFn = europeFunctions
    .runWith(runtimeOpts)
    .storage.bucket().object()
    .onFinalize(async (object) => {
        const fullPath = object.name;
        const fullPathSplit = fullPath.split("/");

        const shouldProcess = fullPathSplit.length === 4 && fullPathSplit[2] === "original";

        if (!shouldProcess) {
            return logger.warn("This function only processes " +
                "following path: /<root>/{entityId}/original/{file}",
                { path: object.name }
            );
        }

        logger.info(`Processing image: ${fullPath}`);

        // basic metadata
        const root = fullPathSplit[0];
        const entityId = fullPathSplit?.[1];

        const fileName = fullPathSplit?.[fullPathSplit.length - 1];
        const noExtFileName = path.basename(fileName, path.extname(fileName));

        // processing settings
        const settings = (await store.doc("config/image-processing").get()).data() as ImageProcessingSettings;
        logger.info('Loaded settings:' + JSON.stringify(settings));

        // make local folders where we'll process the image
        // in case functions preserve some kind local cache
        const localFolderUID = uuidv4();
        const tempFolder = path.join(os.tmpdir(), "bsnouts-images", localFolderUID);
        await mkdirp(tempFolder);

        const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

        logger.log('Downloading image');
        const originalLocalPath = `${tempFolder}/${fileName}`;
        await bucket.file(fullPath).download({ destination: originalLocalPath });

        logger.log(`Processing image ${fileName}`);
        const thumbLocalPath = `${tempFolder}/${noExtFileName}_thumb.jpg`;
        const compressedLocalPath = `${tempFolder}/${noExtFileName}_compressed.jpg`;

        logger.log(`Transforming to ${compressedLocalPath}`);
        await sharp(originalLocalPath)
            .resize({
                width: settings.compressResizeWidth ?? 500,
                height: settings.compressResizeHeight ?? 500,
                fit: 'inside',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .jpeg({ quality: settings.compressQuality ?? 50, progressive: true })
            .toFile(compressedLocalPath);

        logger.log(`Transforming to ${thumbLocalPath}`);
        await sharp(originalLocalPath)
            .resize({
                width: 80,
                height: 80,
                fit: 'inside',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(thumbLocalPath);

        logger.log('Uploading processing artifacts');

        // const originalImage = `${tempFolder}/${fileName}`;
        const thumbImage = `${tempFolder}/${noExtFileName}_thumb.jpg`;
        const compressedImage = `${tempFolder}/${noExtFileName}_compressed.jpg`;

        const storageDest = `${root}/${entityId}`;
        const thumbDestination = `${storageDest}/thumb/${noExtFileName}_thumb.jpg`;
        const compressedDest = `${storageDest}/compressed/${noExtFileName}_compressed.jpg`;

        const uploadOptions = {
            gzip: true,
            public: true,
            metadata: {
                cacheControl: 'public,max-age=1210000',
                contentType: 'image/jpeg',
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                }
            }
        };

        logger.info(`Uploading ${fileName}_compressed.jpg`);
        await bucket.upload(compressedImage, { destination: compressedDest, ...uploadOptions });

        logger.info(`Uploading ${fileName}_thumb.jpg`);
        await bucket.upload(thumbImage, { destination: thumbDestination, ...uploadOptions });

        // fs.unlinkSync(thumbImage);
        // fs.unlinkSync(originalImage);
        // fs.unlinkSync(compressedImage);
        // fs.unlinkSync(tempFolder);
    });
