import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import * as fs from 'fs';
import { mkdirp } from 'mkdirp';
import Stripe from "stripe";
import { config, europeFunctions, store } from "../app";
import { SnoutsProduct, SnoutsProductId, StripePrice, StripeProduct } from './shop.models';

const path = require('path');
const os = require('os');

const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

// TODO: Remove
export const setProductCatalogHttpFn = europeFunctions
    .https
    .onCall(async (data, ctx) => {
        await syncCatalogToStripe('product-catalog/product-catalog.json', 'product-catalog.json');
    })

export const setProductCatalogFn = europeFunctions
    .storage.bucket().object()
    .onFinalize(async (object) => {
        const bucketPath = object.name;
        const fileName = 'product-catalog.json'

        if (!bucketPath.startsWith('product-catalog') || bucketPath.indexOf(fileName) === -1) {
            return logger.warn("This function only processes " +
                "following path: /<root>/{entityId}/original/{file}",
                { path: bucketPath }
            );
        }

        await syncCatalogToStripe(bucketPath, fileName);
    })

async function syncCatalogToStripe(catalogBucketPath: string, catalogFileName: string) {
    const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const tempFolder = path.join(os.tmpdir(), "bsnouts-product-catalog");
    await mkdirp(tempFolder);

    logger.log('Downloading product catalog');
    await bucket.file(catalogBucketPath).download({ destination: `${tempFolder}/${catalogFileName}` });

    logger.log('Reading product catalog');
    const snoutsCatalogJson = fs.readFileSync(`${tempFolder}/${catalogFileName}`, 'utf-8');
    const snoutsCatalogParsed: SnoutsProduct[] = JSON.parse(snoutsCatalogJson);
    const snoutsCatalog = new Map<SnoutsProductId, SnoutsProduct>(snoutsCatalogParsed.map(x => [x.id, x]));

    logger.log('Archiving current catalog in stripe');
    await archiveCurrentStripeCatalog();

    logger.log('Syncing catalog into stripe');
    await createCatalogInStripe(snoutsCatalog)

    logger.log('Persisting catalog to firestore');
    await createCatalogInDatabase(snoutsCatalog);

    logger.log('Finished');
}

async function archiveCurrentStripeCatalog() {
    const prices: Stripe.Price[] = [];
    const products: Stripe.Product[] = [];

    let hasMore = true;
    while (hasMore) {
        const res = await api.prices.list({ active: true });
        prices.push(...res.data);
        hasMore = res.has_more;
    }

    hasMore = true;
    while (hasMore) {
        const res = await api.products.list({ active: true });
        products.push(...res.data);
        hasMore = res.has_more;
    }

    for (const p of prices) {
        await api.prices.update(p.id, { active: false });
    }
    for (const p of products) {
        await api.products.update(p.id, { active: false });
    }
}

/** 
 * Loads Brave Snouts product catalog into stripe via stripe API 
 * Brave snouts products are varied by sizes and variations
 * This loads sizes * variations products into stripe catalog for every brave snouts product
 * Products are differentiated then by order of sizes and variations and in that way updated or archived in stripe
 * */
async function createCatalogInStripe(snoutsCatalog: Map<SnoutsProductId, SnoutsProduct>) {
    // new stripe data (from our catalog)
    const newStripeProducts = [...snoutsCatalog.values()].map(x => toStripeProducts(x)).flat(1);

    // sync with stripe API and modify catalog to contain information about stripe's productId and priceId
    for (const newProduct of newStripeProducts) {
        const newPrice = newProduct.price;

        const curProduct = await createProduct(newProduct)
        const curPrice = await createPrice(curProduct, newPrice);

        const bsnoutsProduct = snoutsCatalog.get(newProduct.variation.snoutsProductId);
        bsnoutsProduct.stripeProducts ??= [];
        bsnoutsProduct.stripeProducts.push({
            sizeIdx: newProduct.variation.sizeIdx,
            variationIdx: newProduct.variation.variationIdx,
            stripePriceId: curPrice.id,
            stripeProductId: curProduct.id,
            stripeProductName: curProduct.name
        });
    }
}

/**
 * Catalog item = product with variations and sizes
 * 
 * Amount of stripe products = SIZES * VARIATIONS
 * 
 * Stripe item = one unique variation and size of product
 *   - ID: "itemId-incrementSizeId-incrementVariationId" 
 *   - Increments are starting from 0 up to length of array
 *   - If we delete item in product catalog there will be extra item remaining in stripe, it needs to be deactivated
 *   - One price per product => All unique Stripe Items have the same price
 *   - Stripe price ID == Catalog Item Id
 *   - Stripe product ID starts with Catalog Item Id
 */
function toStripeProducts(item: SnoutsProduct): StripeProduct[] {
    const products: StripeProduct[] = [];

    for (let sizeIdx = 0; sizeIdx < item.sizes.length; sizeIdx++) {
        for (let variationIdx = 0; variationIdx < item.variations.length; variationIdx++) {
            products.push({
                id: `${item.id}-${sizeIdx}-${variationIdx}`,
                variation: {
                    id: `${item.id}-${sizeIdx}-${variationIdx}`,
                    sizeIdx: sizeIdx,
                    variationIdx: variationIdx,
                    snoutsProductId: item.id
                },
                price: {
                    id: item.id,
                    amount: item.price,
                    currency: item.currency
                },
                slug: item.slug,
                name: `${item.name} ${item.sizes[sizeIdx]} ${item.variations[variationIdx].colorName}`,
                images: item.variations[variationIdx].images,
                description: item.description,
            })
        }
    }

    return products;
}

async function createProduct(newProduct: StripeProduct) {
    return await api.products.create({
        name: newProduct.name,
        active: true,
        description: newProduct.description,
        images: newProduct.images,
        metadata: { firestoreId: newProduct.id, firestoreData: JSON.stringify(newProduct) },
        shippable: true,
        type: 'good',
        url: `https://localhost:4200/merch/proizvod/${newProduct.slug}`,
        // non taxable https://stripe.com/docs/tax/tax-categories 
        tax_code: 'txcd_00000000',
    });
}

async function createPrice(curProduct: Stripe.Product, newPrice: StripePrice) {
    return await api.prices.create({
        active: true,
        tax_behavior: 'exclusive',
        billing_scheme: 'per_unit',
        currency: newPrice.currency.toLowerCase(),
        unit_amount: Math.round(newPrice.amount * 100),
        nickname: newPrice.id,
        metadata: { firestoreId: newPrice.id, firestoreData: JSON.stringify(newPrice) },
        product: curProduct.id,
    });
}

async function createCatalogInDatabase(snoutsCatalog: Map<SnoutsProductId, SnoutsProduct>) {
    // ensure deleted
    await store.recursiveDelete(store.collection('shop'));

    // write new
    const bulkWriter = store.bulkWriter();

    for (const bsnoutsProduct of snoutsCatalog.values()) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        bulkWriter.create(store.doc(`shop/${bsnoutsProduct.slug}`), bsnoutsProduct);
    }

    await bulkWriter.close();
}