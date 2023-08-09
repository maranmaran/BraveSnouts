import { Asset, Entry, EntrySkeletonType, createClient } from "contentful";
import * as functions from 'firebase-functions';
import { store } from "../app";

export interface Animal {
    name: string;
    slug: string;
    description: string,
    images: string[];
    instagram: string;
    facebook: string;
}


export const setAdoptionAnimalsFn = functions.region('europe-west1').pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {
        const content_type = 'braveSnoutsAdoption';
        const client = createClient({
            space: functions.config().contentful.space,
            accessToken: functions.config().contentful.secret,
        });

        const contentfulAnimals = await client.getEntries({ content_type: content_type });

        await store.recursiveDelete(store.collection('adoption'));

        const writer = store.bulkWriter();

        for (const product of contentfulAnimals.items) {
            const animal = await toAnimal(product);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            writer.create(store.doc(`adoption/${animal.slug}`), animal)
        }

        await writer.close();
    })

async function toAnimal(entry: Entry<EntrySkeletonType, undefined, string>) {
    return <Animal>{
        name: entry.fields.name,
        slug: entry.fields.slug,
        description: entry.fields.description,
        images: (<Asset[]>entry.fields.images).map(x => x.fields.file.url),
        instagram: entry.fields.instagram,
        facebook: entry.fields.facebook,
    };
}
