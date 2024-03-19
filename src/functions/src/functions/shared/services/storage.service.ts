import axios from "axios";
import * as fs from 'fs';
import { mkdirp } from "mkdirp";
import * as os from 'os';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { appStorage } from "../../app";
import { FirebaseFile } from "../../auctions/models/models";

export class StorageService {

    public static create = () => new StorageService();

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

    public static isProcessedAlready(obj: any) {
        return StorageService.isTrue(obj?.metadata?.processedByFirebaseFunction) ||
            StorageService.isTrue(obj?.metadata?.metadata?.processedByFirebaseFunction);
    }

    private static isTrue(value) {
        return value === true || value === "true";
    }

    async recursiveDelete(prefix: string) {
        await appStorage().bucket().deleteFiles({ prefix });
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

        const pathOrig = `${external.destination}/original/${noExtFileName}_original`;
        const res = await appStorage().bucket().upload(localFilePath, { destination: pathOrig, ...this.uploadOptions });

        // make firebase file model
        const url = decodeURIComponent(await res[0].publicUrl()); // this is gcloud link...

        const pathThumb = decodeURIComponent(pathOrig).replace('/original/', '/thumb/').replace('_original', '_thumb');
        const fUrlThumb = decodeURIComponent(url).replace('/original/', '/thumb/').replace('_original', '_thumb');

        const pathComp = decodeURIComponent(pathOrig).replace('/original/', '/compressed/').replace('_original', '_compressed');
        const fUrlComp = decodeURIComponent(url).replace('/original/', '/compressed/').replace('_original', '_compressed');

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