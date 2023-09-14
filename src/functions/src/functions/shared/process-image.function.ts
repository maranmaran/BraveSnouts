import { RuntimeOptions, logger } from 'firebase-functions';
import { mkdirp } from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { appStorage, appStore, europeFunctions } from '../app';

// TODO: Deprecate some settings
interface ImageProcessingSettings {
    compress: boolean;
    compressQuality: number;
    compressResizeHeight: number;
    compressResizeWidth: number;
    compressMethod: string;
    compressExtension: string;
}

const runtimeOpts: Partial<RuntimeOptions> = {
    timeoutSeconds: 540,
    memory: "1GB"
}

const supportedExtensions = ["image", "jpeg", "png", "jpg"];

// Processes newly added images and creates
// Original, Compressed, Thumbnail versions of image in storage
// Links are created in advance by Client
export const processImageFn = europeFunctions.runWith(runtimeOpts)
    .storage.bucket().object()
    .onFinalize(async (object) => {
        const fullPath = object.name;
        // -------------  IMPORTANT -------------

        // */something/original/*.jpg
        const filePath = path.dirname(object.name);
        // *.jpg
        const fileName = path.basename(object.name);
        // */something
        const rootPath = path.dirname(filePath) == '.' ? "" : path.dirname(filePath);
        // */something/original/image.jpg -> image
        const noExtFileName = path.basename(fileName, path.extname(fileName));

        // Exit conditions, beware of loops
        const tooLongPath = fullPath.length > 100;
        const rootPathIsLocatedInDirectoryNamedOriginal = rootPath.includes('/original/');
        const uploadedFilePathIsNotInDirectoryNamedOriginal = path.basename(filePath) !== 'original';
        const notSupportedExtension = supportedExtensions.filter(x => object.contentType.includes(x)).length == 0;

        const exitCondition = tooLongPath
            || notSupportedExtension
            || rootPathIsLocatedInDirectoryNamedOriginal
            || uploadedFilePathIsNotInDirectoryNamedOriginal;

        if (exitCondition) {
            return logger.warn("This function only processes " +
                "following path: */original/{file}",
                {
                    path: object.name,
                    tooLongPath,
                    notSupportedExtension,
                    rootPathIsLocatedInDirectoryNamedOriginal,
                    uploadedFilePathIsNotInDirectoryNamedOriginal
                }
            );
        }

        logger.info(`Processing image: ${fullPath}`);

        // processing settings
        let settings = (await appStore.doc("config/image-processing").get()).data() as ImageProcessingSettings;
        settings ??= {
            compress: true,
            compressMethod: 'JPG',
            compressExtension: 'jpg',
            compressResizeWidth: 500,
            compressResizeHeight: 500,
            compressQuality: 50,
        };

        logger.info('Loaded settings:' + JSON.stringify(settings));

        // make local folders where we'll process the image
        // in case functions preserve some kind local cache
        const localFolderUID = uuidv4();
        const tempFolder = path.join(os.tmpdir(), "bsnouts-images", localFolderUID);
        await mkdirp(tempFolder);

        const bucket = appStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

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
            .withMetadata()
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
            .withMetadata()
            .jpeg({ quality: 85, progressive: true })
            .toFile(thumbLocalPath);

        logger.log('Uploading processed artifacts');

        // const originalImage = `${tempFolder}/${fileName}`;
        const thumbImage = `${tempFolder}/${noExtFileName}_thumb.jpg`;
        const compressedImage = `${tempFolder}/${noExtFileName}_compressed.jpg`;

        const thumbDestination = `${rootPath}/thumb/${noExtFileName}_thumb.jpg`;
        const compressedDest = `${rootPath}/compressed/${noExtFileName}_compressed.jpg`;

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

        logger.info(`Uploading ${fileName}_compressed.jpg to ${compressedDest}`);
        await bucket.upload(compressedImage, { destination: compressedDest, ...uploadOptions });

        logger.info(`Uploading ${fileName}_thumb.jpg to ${thumbDestination}`);
        await bucket.upload(thumbImage, { destination: thumbDestination, ...uploadOptions });

        // fs.unlinkSync(thumbImage);
        // fs.unlinkSync(originalImage);
        // fs.unlinkSync(compressedImage);
        // fs.unlinkSync(tempFolder);
    });
