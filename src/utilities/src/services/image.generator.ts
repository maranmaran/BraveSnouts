import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as GM from 'gm';
import * as path from 'path';
import { Picsum } from 'picsum-photos';
import sharp from 'sharp';
import { Stream } from 'stream';
import { v4 as uuid } from 'uuid';
import { storage } from '../base-setup';
import { FirebaseFile } from '../models';

// choco install imagemagick.app
// this is available as pre-installed binary in cloud functions
const magick = GM.subClass({ imageMagick: true });

export class ImageGenerator {
    private readonly auctionId: string;

    constructor(auctionId: string) {
        this.auctionId = auctionId;
        this.fullReset();
    }

    private get transformDir() { return this.dir + "-transformed" }
    private get dir() { return path.resolve(__dirname, './../../tmp/images') }

    private fullReset() {
        this.resetDir(this.dir);
        this.resetDir(this.transformDir);
    }

    private resetDir(dir: string) {
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true })
    }

    async generate(count: number) {
        await this.generateLocal(count);
        await this.transformLocal();

        const result = await this.uploadLocal(this.auctionId);
        this.fullReset();

        return result;
    }

    async generateLocal(count: number) {
        for (let i = 0; i < count; i++) {
            const image = await Picsum.random();

            const response = await axios.get(
                image.download_url,
                { responseType: 'stream' }
            ) as AxiosResponse<Stream>;

            const filename = `${image.id}.jpg`;
            const filepath = path.join(this.dir, filename);

            const fileW = fs.createWriteStream(filepath);
            const writeToDisk = new Promise<void>((resolve, reject) => {
                fileW.on('finish', resolve);
                fileW.on('error', reject);
                response.data.pipe(fileW);
            });

            await writeToDisk;
        }
    }

    async transformLocal() {
        const files = fs.readdirSync(this.dir);

        for (const file of files) {

            const originalPath = this.dir;
            const transformedPath = this.transformDir;

            await this.transformImage(file, originalPath, transformedPath, {
                height: 500,
                width: 500,
                quality: 50,
                thumb: false
            });

            await this.transformImage(file, originalPath, transformedPath, {
                height: 150,
                width: 150,
                quality: 80,
                thumb: true
            });

        }
    }

    private async transformImage(fileName: string, sourcePath: string, destinationPath: string, config: any) {
        const baseFileName = path.basename(fileName, path.extname(fileName));
        const transformedFileName = `${baseFileName}${config.thumb ? '_thumb' : ''}.jpg`;

        await sharp(`${sourcePath}/${fileName}`)
            .rotate()
            .blur(0.5)
            .resize(config.width, config.height)
            .jpeg({ quality: config.quality, progressive: true })
            .toFile(`${destinationPath}/${transformedFileName}`);
    }

    async uploadLocal(auctionId: string) {
        const result: FirebaseFile[] = [];

        for (const file of fs.readdirSync(this.dir)) {
            const image = path.basename(file, path.extname(file));

            const originalResp = await storage.bucket().upload(`${this.dir}\\${image}.jpg`, {
                destination: `auction-items/${auctionId}/original/${image}_original`, gzip: true, public: true, metadata: {
                    cacheControl: 'public,max-age=1210000',
                    contentType: 'image/jpeg',
                    metadata: {
                        firebaseStorageDownloadTokens: uuid(),
                    }
                }
            });

            const compressedResp = await storage.bucket().upload(`${this.transformDir}\\${image}.jpg`, {
                destination: `auction-items/${auctionId}/compressed/${image}_compressed`, gzip: true, public: true, metadata: {
                    cacheControl: 'public,max-age=1210000',
                    contentType: 'image/jpeg',
                    metadata: {
                        firebaseStorageDownloadTokens: uuid(),
                    }
                }
            });

            const thumbResp = await storage.bucket().upload(`${this.transformDir}\\${image}_thumb.jpg`, {
                destination: `auction-items/${auctionId}/thumb/${image}_thumb`, gzip: true, public: true,
                metadata: {
                    cacheControl: 'public,max-age=1210000',
                    contentType: 'image/jpeg',
                    metadata: {
                        firebaseStorageDownloadTokens: uuid(),
                    }
                }
            });

            const originalUrl = originalResp[0].publicUrl()
            const imgUrl = compressedResp[0].publicUrl()
            const thumbUrl = thumbResp[0].publicUrl()

            result.push(<FirebaseFile>{
                name: image,
                path: `auction-items/${image}`,
                type: 'image',
                urlOrig: originalUrl,
                urlComp: imgUrl,
                urlThumb: thumbUrl
            });
        }

        return result;
    }
}
