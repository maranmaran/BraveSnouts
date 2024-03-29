import { Asset, AssetFile, Entry, EntrySkeletonType, createClient } from "contentful";
import * as functions from 'firebase-functions';
import { appStore, europeFunctions } from "../app";
import { FirebaseFile } from "../auctions/models/models";
import { StorageService } from "../shared/services/storage.service";

export interface Animal {
    name: string;
    slug: string;
    description: string,
    images: AssetFile[] | FirebaseFile[];
    instagram: string;
    facebook: string;
    shortDescription: string;
    tags: string[];
}

let storage: StorageService = undefined;

export const setAdoptionAnimalsFn = europeFunctions().https
    .onCall(async (data, ctx) => await setAdoptionAnimalsInternal());

export async function setAdoptionAnimalsInternal() {
    // retrieve cms data
    const content_type = 'braveSnoutsAdoption';
    const client = createClient({
        space: functions.config().contentful.space,
        accessToken: functions.config().contentful.secret,
    });

    const contentfulAnimals = await client.getEntries({ content_type: content_type });

    // clear storages
    storage = StorageService.create();

    await appStore().recursiveDelete(appStore().collection('adoption'));
    await storage.recursiveDelete('adoption');

    // write new data
    const writer = appStore().bulkWriter();

    for (const contentfulAnimal of contentfulAnimals.items) {
        const animal = await toAnimal(contentfulAnimal);
        animal.images = await uploadToStorage(animal.slug, animal.images as AssetFile[]);
        animal.description = animal.description.split('\n').join('<br/>');;

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        writer.set(appStore().doc(`adoption/${animal.slug}`), animal)
    }

    await writer.close();
}

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
        shortDescription: entry.fields.shortDescription,
        tags: entry.fields.tags,
        images: (<Asset[]>entry.fields.images).map(x => x.fields.file)
    };
}
