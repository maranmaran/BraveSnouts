import axios from "axios";
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { mkdirp } from "mkdirp";
import { v4 as uuidv4 } from 'uuid';
import { FirebaseFile } from "../../auctions/models/models";
const sharp = require('sharp');
const path = require('path');
const os = require('os');

export class StorageService {

    readonly bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

    readonly uploadOptions = {
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

    async recursiveDelete(prefix: string) {
        await this.bucket.deleteFiles({ prefix });
    }

    async externalToStorage(external: { name: string, url: string, destination: string }) {
        // download external
        const response = await axios.get(external.url, { responseType: 'arraybuffer' });
        const image = Buffer.from(response.data, 'binary');

        // save local
        const localTemp = path.join(os.tmpdir(), "external-images");
        const localFilePath = `${localTemp}/${external.name}`;
        const noExtFileName = path.basename(external.name, path.extname(external.name));

        await mkdirp(localTemp);
        fs.writeFileSync(localFilePath, image);

        // upload to destination

        const pathOrig = `${external.destination}/original/${noExtFileName}_original.jpg`;
        const res = await this.bucket.upload(localFilePath, { destination: pathOrig, ...this.uploadOptions });

        // make firebase file model
        const url = await res[0].publicUrl(); // this is gcloud link...

        const pathThumb = pathOrig.replace('%2Foriginal%2F', '%2Fthumb%2F').replace('_original', '_original_thumb');
        const fUrlThumb = url.replace('%2Foriginal%2F', '%2Fthumb%2F').replace('_original', '_original_thumb');

        const pathComp = pathOrig.replace('%2Foriginal%2F', '%2Fcompressed%2F').replace('_original', '_original_compressed');
        const fUrlComp = url.replace('%2Foriginal%2F', '%2Fcompressed%2F').replace('_original', '_original_compressed');

        const firebaseFile = <FirebaseFile>{
            name: external.name,
            type: 'image',
            original: {
                path: pathOrig,
                fUrl: url,
                gUrl: url
            },
            compressed: {
                path: pathComp,
                fUrl: fUrlComp,
                gUrl: fUrlComp
            },
            thumbnail: {
                path: pathThumb,
                fUrl: fUrlThumb,
                gUrl: fUrlThumb
            },
        };

        return firebaseFile;
    }
}