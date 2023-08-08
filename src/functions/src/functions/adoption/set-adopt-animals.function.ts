import { Asset, Entry, EntrySkeletonType, createClient } from "contentful";
import { config, europeFunctions, store } from "../..";

export interface Animal {
    name: string;
    slug: string;
    description: string,
    images: string[];
    instagram: string;
    facebook: string;
}

const content_type = 'braveSnoutsAdoption';
const client = createClient({
    space: config.contentful.space,
    accessToken: config.contentful.secret,
});

export const setAdoptAnimalsFn = europeFunctions.pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {
        const contentfulAnimals = await client.getEntries({ content_type: content_type });

        const writer = store.bulkWriter();

        for (const product of contentfulAnimals.items) {
            const animal = await toAnimal(product);
            writer.create(store.doc(`adopt-animals/${animal.slug}`), animal)
        }

        await writer.close();
    }
    )

export async function toAnimal(entry: Entry<EntrySkeletonType, undefined, string>) {
    return <Animal>{
        name: entry.fields.name,
        slug: entry.fields.slug,
        description: entry.fields.description,
        images: (<Asset[]>entry.fields.images).map(x => x.fields.file.url),
        instagram: entry.fields.instagram,
        facebook: entry.fields.facebook,
    };
}
