import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { Asset, Entry, EntrySkeletonType, createClient } from "contentful";
import * as functions from 'firebase-functions';
import { europeFunctions, store } from "../app";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    hero: string;
    content: string;
    instagram: string;
    facebook: string;
}


export const setBlogPostsFn = europeFunctions.pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {

        const content_type = 'braveSnoutsBlog';
        const client = createClient({
            space: functions.config().contentful.space,
            accessToken: functions.config().contentful.secret,
        });

        const contentfulPosts = await client.getEntries({ content_type: content_type });

        await store.recursiveDelete(store.collection('blog'));

        const writer = store.bulkWriter();

        for (const entry of contentfulPosts.items) {
            const post = await toBlogPost(entry);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            writer.create(store.doc(`blog/${post.slug}`), post)
        }

        await writer.close();
    })


function toBlogPost(entry: Entry<EntrySkeletonType, undefined, string>) {
    return <BlogPost>{
        title: entry.fields.title,
        slug: entry.fields.slug,
        date: new Date(entry.fields.date as string),
        tags: entry.metadata.tags.map(x => x.sys.id),
        description: entry.fields.description,
        hero: (<Asset>entry.fields.heroImage).fields.file.url,
        instagram: entry.fields.instagram,
        facebook: entry.fields.facebook,
        content: documentToHtmlString(entry.fields.content as any, {
            renderNode: {
                ['embedded-asset-block']: (node, children) => {
                    // render the EMBEDDED_ASSET as you need
                    return `
                        <img class="h-auto w-[55%] self-center" 
                            src="${'https://' + node.data.target.fields.file.url}"
                            alt="${node.data.target.fields.description}"
                        />
                   `
                }
            }
        })
    };
}
