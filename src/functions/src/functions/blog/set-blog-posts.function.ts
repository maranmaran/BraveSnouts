import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { BLOCKS, Block, Document, Inline, Text } from "@contentful/rich-text-types";
import { Asset, AssetFile, Entry, EntrySkeletonType, createClient } from "contentful";
import { appConfig, appStore, europeFunctions } from "../app";
import { FirebaseFile } from "../auctions/models/models";
import { StorageService } from "../shared/services/storage.service";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    hero: AssetFile | FirebaseFile;
    content: string;
    instagram: string;
    facebook: string;
}

const storage = new StorageService();

export const setBlogPostsFn = europeFunctions.pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {

        const content_type = 'braveSnoutsBlog';
        const client = createClient({
            space: appConfig.contentful.space,
            accessToken: appConfig.contentful.secret,
        });

        const contentfulPosts = await client.getEntries({ content_type: content_type });

        await appStore.recursiveDelete(appStore.collection('blog'));
        await storage.recursiveDelete('blog');

        const writer = appStore.bulkWriter();

        for (const entry of contentfulPosts.items) {
            const post = await toBlogPost(entry);

            post.hero = (await uploadToStorage(post.slug, [post.hero as AssetFile]))[0];

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            writer.create(appStore.doc(`blog/${post.slug}`), post)
        }

        await writer.close();
    })

const filesMap = new Map<string, FirebaseFile>();
async function toBlogPost(entry: Entry<EntrySkeletonType, undefined, string>) {
    // get assets from rich text entry.fields.content
    // hash them
    // retrieve data in render asset
    const assets: AssetFile[] = []
    getAssetsRecursive(entry.fields.content as Document, assets);
    const files = await uploadToStorage(entry.fields.slug.toString(), assets);
    files.forEach(f => filesMap.set(f.name, f));

    return <BlogPost>{
        title: entry.fields.title,
        slug: entry.fields.slug,
        date: new Date(entry.fields.date as string),
        tags: entry.metadata.tags.map(x => x.sys.id),
        description: entry.fields.description,
        hero: (<Asset>entry.fields.heroImage).fields.file,
        instagram: entry.fields.instagram,
        facebook: entry.fields.facebook,
        content: documentToHtmlString(entry.fields.content as Document, {
            renderNode: {
                ['embedded-asset-block']: (node, children) => renderAsset(node, children)
            }
        })
    };
}

function getAssetsRecursive(node: Block | Inline | Text, assets: AssetFile[]) {
    if (!node) {
        return;
    }

    if (node.nodeType === BLOCKS.EMBEDDED_ASSET) {
        assets.push(node.data.target.fields.file);
    }

    for (const block of (node as Block | Inline)?.content ?? []) {
        getAssetsRecursive(block, assets);
    }
}

function renderAsset(node: Block | Inline, _) {
    const name = node.data.target.fields.file.fileName;
    const fallback = node.data.target.fields.file.url;

    let fFile: FirebaseFile;
    if (filesMap.has(name)) {
        fFile = filesMap.get(name);
    }

    const original = fFile?.original?.gUrl ?? fallback;
    const compressed = fFile?.compressed?.gUrl ?? fallback;
    const thumbnail = fFile?.thumbnail?.gUrl ?? fallback;

    return `
        <img 
            style="
                max-width: 450px;
                width: 70vw;
                align-self: center;
                background-size: contain;
                background-repeat: no-repeat;
                background: url(${original}) url(${compressed}) url(${thumbnail})";
            "
            src="${original}"
        />
    `
}

async function uploadToStorage(id: string, files: AssetFile[]) {
    const fFiles: FirebaseFile[] = [];
    for (const file of files) {
        fFiles.push(
            await storage.externalToStorage({
                url: file.url,
                name: file.fileName,
                destination: `blog/${id}`,
            })
        );
    }
    return fFiles;
}

