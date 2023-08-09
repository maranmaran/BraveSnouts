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
        // contentJson: JSON.stringify(entry.fields.content),
        content: documentToHtmlString(entry.fields.content as any, {
            renderNode: {
                [`embedded-entry-block`]: (node, children) => renderEntry(node, children),
                ['embedded-asset-block']: (node, children) => renderAsset(node, children)
            }
        })
    };
}

function renderEntry(node, _) {
    return `<iframe
                src= { node.data.target.fields.embedUrl }
                height = "100%"
                width = "100%"
                frameBorder = "0"
                scrolling = "no"
                title = { node.data.target.fields.title }
            />`
}

function renderAsset(node, _) {
    return `
        <img 
            style="height: auto; width: 55%; max-height: 350px; align-self: center"
            src="${'https://' + node.data.target.fields.file.url}"
            alt="${node.data.target.fields.description}"
        />
    `
}
