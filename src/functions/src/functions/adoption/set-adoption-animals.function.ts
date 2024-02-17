import { Asset, AssetFile, Entry, EntrySkeletonType, createClient } from "contentful";
import * as functions from 'firebase-functions';
import { appStore } from "../app";
import { FirebaseFile } from "../auctions/models/models";
import { StorageService } from "../shared/services/storage.service";

export interface Animal {
    name: string;
    slug: string;
    description: string,
    images: AssetFile[] | FirebaseFile[];
    instagram: string;
    facebook: string;
}

let storage: StorageService = undefined;

export const setAdoptionAnimalsFn = functions.region('europe-west1').pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {
        // retrieve cms data
        const content_type = 'braveSnoutsAdoption';
        const client = createClient({
            space: functions.config().contentful.space,
            accessToken: functions.config().contentful.secret,
        });

        const contentfulAnimals = await client.getEntries({ content_type: content_type });

        // clear storages
        storage = new StorageService();

        await appStore().recursiveDelete(appStore().collection('adoption'));
        await storage.recursiveDelete('adoption');

        // write new data
        const writer = appStore().bulkWriter();

        for (const product of contentfulAnimals.items) {
            const animal = await toAnimal(product);

            animal.images = await uploadToStorage(animal.slug, animal.images as AssetFile[]);

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            writer.create(appStore().doc(`adoption/${animal.slug}`), animal)
        }

        await writer.close();
    })

async function uploadToStorage(id: string, files: AssetFile[]) {
    const fFiles: FirebaseFile[] = [];
    for (const file of files) {
        fFiles.push(
            await storage.externalToStorage({
                url: file.url,
                name: file.fileName,
                destination: `adoption/${id}`,
            })
        );
    }
    return fFiles;
}

async function toAnimal(entry: Entry<EntrySkeletonType, undefined, string>) {
    return <Animal>{
        name: entry.fields.name,
        slug: entry.fields.slug,
        description: entry.fields.description,
        instagram: entry.fields.instagram,
        facebook: entry.fields.facebook,
        images: (<Asset[]>entry.fields.images).map(x => x.fields.file)
    };
}
