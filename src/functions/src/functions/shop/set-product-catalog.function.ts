import { logger } from "firebase-functions";
import * as fs from 'fs';
import { mkdirp } from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import Stripe from "stripe";
import { appConfig, appStorage, appStore, europeFunctions } from "../app";
import { FirebaseFile } from '../auctions/models/models';

let _api: Stripe = undefined;

const api = () => {
    if (_api) return _api;

    _api = new Stripe(appConfig().stripe.secret, {
        apiVersion: "2022-11-15"
    });

    return _api;
}

export const setProductCatalogFn = europeFunctions().https
    .onCall(async (data, ctx) => {

        const bucketPath = 'product-catalog/product-catalog.json';
        const fileName = 'product-catalog.json'

        await syncCatalogToStripe(bucketPath, fileName);
    })

async function syncCatalogToStripe(catalogBucketPath: string, catalogFileName: string) {
    const bucket = appStorage().bucket();
    const tempFolder = path.join(os.tmpdir(), "bsnouts-product-catalog");
    await mkdirp(tempFolder);

    logger.log('Downloading product catalog');
    await bucket.file(catalogBucketPath).download({ destination: `${tempFolder}/${catalogFileName}` });

    logger.log('Reading product catalog');
    const snoutsCatalog = getCatalog(`${tempFolder}/${catalogFileName}`);

    logger.log('Archiving current catalog in stripe');
    await archiveCurrentStripeCatalog();

    logger.log('Syncing catalog into stripe');
    await createCatalogInStripe(snoutsCatalog)

    logger.log('Persisting catalog to firestore');
    await createCatalogInDatabase(snoutsCatalog);

    logger.log('Finished');
}

function getCatalog(storagePath: string) {
    const json = fs.readFileSync(storagePath, 'utf-8');
    const catalog: InputSnoutsProduct[] = JSON.parse(json);
    const refinedCatalog = refineCatalog(catalog);

    return refinedCatalog;
}

function refineCatalog(catalog: InputSnoutsProduct[]) {
    const refinedCatalog: OutputSnoutsProduct[] = [];
    for (const product of catalog) {

        const outputVariations: OutputSnoutsProductVariation[] = [];
        for (let variation of product.variations) {
            variation = refineCatalogImages(variation);
            outputVariations.push(...flattenByInventorySpecifics(variation));
        }

        refinedCatalog.push({
            variations: outputVariations,
            description: product.description,
            id: product.id,
            name: product.name,
            price: product.price,
            hasSizes: product.hasSizes,
            slug: product.slug,
            stripe: { priceId: '', productId: '' },
            type: product.type,
            gender: product.gender,
        })
    }

    return refinedCatalog;
}

function flattenByInventorySpecifics(variation: InputSnoutsProductVariation) {
    const flattened: OutputSnoutsProductVariation[] = []

    const inventory = Array.isArray(variation.inventory)
        ? variation.inventory
        : [variation.inventory];

    for (const i of inventory) {
        flattened.push({
            colorCode: variation.colorCode,
            colorName: variation.colorName,
            images: variation.images,
            stock: i.stock,
            size: i.size,
        })
    }

    return flattened;
}

function refineCatalogImages(variation: InputSnoutsProductVariation) {
    const files: FirebaseFile[] = [];

    for (const image of variation.images) {
        const imageName = image as any as string; // This is string in the start 100%
        const bucket = process.env.FIREBASE_STORAGE_BUCKET ?? 'bravesnoutsdev.appspot.com';
        const imagesStoragePath = 'product-catalog/images';

        const origUrl = `http://storage.googleapis.com/${bucket}/${imagesStoragePath}/original/${imageName}.jpg`
        const thumbUrl = `http://storage.googleapis.com/${bucket}/${imagesStoragePath}/thumb/${imageName}_thumb.jpg`
        const compUrl = `http://storage.googleapis.com/${bucket}/${imagesStoragePath}/compressed/${imageName}_compressed.jpg`

        files.push({
            name: imageName,
            type: 'image',
            original: {
                fUrl: origUrl,
                gUrl: origUrl,
                path: imagesStoragePath + '/original'
            },
            compressed: {
                fUrl: compUrl,
                gUrl: compUrl,
                path: imagesStoragePath + '/compressed'
            },
            thumbnail: {
                fUrl: thumbUrl,
                gUrl: thumbUrl,
                path: imagesStoragePath + '/thumb'
            }
        })
    }

    variation.images = files;
    return variation;
}

async function archiveCurrentStripeCatalog() {
    let hasMore = true;
    while (hasMore) {
        const res = await api().prices.list({ active: true, });
        hasMore = res.has_more;

        for (const p of res.data) {
            await api().prices.update(p.id, { active: false });
        }
    }

    hasMore = true;
    while (hasMore) {
        const res = await api().products.list({ active: true });
        hasMore = res.has_more;

        for (const p of res.data) {
            await api().products.update(p.id, { active: false });
        }
    }
}

async function createCatalogInStripe(snoutsCatalog: OutputSnoutsProduct[]) {
    // sync with stripe API and modify catalog to contain information about stripe's productId and priceId
    for (const newProduct of snoutsCatalog) {
        const newPrice = { id: newProduct.id, amount: newProduct.price };

        const curProduct = await createProduct(newProduct)
        const curPrice = await createPrice(curProduct, newPrice);

        newProduct.stripe = {
            priceId: curPrice.id,
            productId: curProduct.id,
        }
    }
}

async function createProduct(product: OutputSnoutsProduct) {
    return await api().products.create({
        name: product.slug,
        active: true,
        type: 'good',
        shippable: true,
        description: product.description,
        images: product.variations.flatMap(x => x.images.flatMap(y => y.original.gUrl)).slice(0, 8),
        url: `${appConfig().base.url}/merch/proizvod/${product.slug}`,
        metadata: { firestoreId: product.slug },
        tax_code: 'txcd_00000000', // non taxable https://stripe.com/docs/tax/tax-categories
    });
}

async function createPrice(product: Stripe.Product, price: { id: string, amount: number }) {
    return await api().prices.create({
        active: true,
        tax_behavior: 'exclusive',
        billing_scheme: 'per_unit',
        currency: "eur",
        unit_amount: Math.round(price.amount * 100),
        nickname: product.name,
        product: product.id,
        metadata: { firestoreId: price.id },
    });
}

async function createCatalogInDatabase(snoutsCatalog: OutputSnoutsProduct[]) {
    // ensure deleted
    await appStore().recursiveDelete(appStore().collection('shop'));

    // write new
    const bulkWriter = appStore().bulkWriter();

    for (const bsnoutsProduct of snoutsCatalog.values()) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        bulkWriter.create(appStore().doc(`shop/${bsnoutsProduct.slug}`), bsnoutsProduct);
    }

    await bulkWriter.close();
}

interface InputSnoutsProduct {
    id: string;
    slug: string;
    name: string;
    type: string;
    gender?: string;
    price: number;
    description: string;
    hasSizes: boolean;
    variations: InputSnoutsProductVariation[];
}

interface InputSnoutsProductVariation {
    colorName: string;
    colorCode: string;
    images: FirebaseFile[],
    inventory: { stock: number, size?: string }[] | { stock: number, size?: string }
}

interface OutputSnoutsProduct {
    id: string;
    slug: string;
    name: string;
    type: string;
    gender?: string;
    price: number;
    description: string;
    hasSizes: boolean;
    stripe: OutputStripeProduct,
    variations: OutputSnoutsProductVariation[];
}

interface OutputStripeProduct {
    productId: string;
    priceId: string;
}

interface OutputSnoutsProductVariation {
    stock: number;
    size: string;
    colorName: string;
    colorCode: string;
    images: FirebaseFile[],
}
