import * as admin from 'firebase-admin';
import { logger } from "firebase-functions";
import * as fs from 'fs';
import { mkdirp } from 'mkdirp';
import Stripe from "stripe";
import { config, europeFunctions, store } from "../app";
import { SnoutsProduct, SnoutsProductId, SnoutsProductVariationId, StripePrice, StripeProduct } from './shop.models';

const path = require('path');
const os = require('os');

const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

// TODO: Remove
export const setProductCatalogHttpFn = europeFunctions
    .https
    .onCall(async (data, ctx) => {
        const curPrices = (await api.prices.list({ active: true })).data;
        const curProducts = (await api.products.list({ active: true })).data;

        for (const p of curPrices) {
            try {
                await api.prices.update(p.id, { active: false });
            } catch (e) {
                logger.error(e);
            }
        }

        for (const p of curProducts) {
            try {
                await api.products.update(p.id, { active: false });
            } catch (e) {
                logger.error(e);
            }
        }

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

    logger.log('Syncing catalog into stripe');
    await syncToStripe(snoutsCatalog)

    logger.log('Persisting catalog to firestore');
    await saveCatalogInStore(snoutsCatalog);

    logger.log('Finished');
}

/** 
 * Loads Brave Snouts product catalog into stripe via stripe API 
 * Brave snouts products are varied by sizes and variations
 * This loads sizes * variations products into stripe catalog for every brave snouts product
 * Products are differentiated then by order of sizes and variations and in that way updated or archived in stripe
 * */
async function syncToStripe(snoutsCatalog: Map<SnoutsProductId, SnoutsProduct>) {
    // new stripe data (from our catalog)
    const newStripeProducts = [...snoutsCatalog.values()].map(x => toStripeProducts(x)).flat(1);

    // existing stripe data
    const curPrices = (await api.prices.list({ active: true, type: 'one_time' })).data;
    const curProducts = (await api.products.list({ active: true, type: 'good' })).data;
    const curPricesMap = new Map<SnoutsProductId, Stripe.Price>(curPrices.map(x => [x.metadata['firestoreId'], x]));
    const curProductsMap = new Map<SnoutsProductVariationId, Stripe.Product>(curProducts.map(x => [x.metadata['firestoreId'], x]));

    // sync with stripe API and modify catalog to contain information about stripe's productId and priceId
    for (const newProduct of newStripeProducts) {
        const newPrice = newProduct.price;

        let curPrice = curPricesMap.get(newPrice.id);
        let curProduct = curProductsMap.get(newProduct.id);

        curProduct = await syncProduct(curProduct?.id, curProduct, newProduct, curProductsMap)
        curPrice = await syncPrice(curPrice?.id, curPrice, curProduct, newPrice, curPricesMap);

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

    // ensure remaining (not present in catalog) products and prices from stripe are archived
    for (const deletedProduct of curProductsMap.values()) {
        await api.products.update(deletedProduct.id, { active: false });
    }
    for (const deletedPrice of curPricesMap.values()) {
        await api.prices.update(deletedPrice.id, { active: false });
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

async function syncProduct(id: string, curProduct: Stripe.Product, newProduct: StripeProduct, map: Map<string, Stripe.Product>) {
    // create product
    if (!curProduct) {
        logger.debug('Creating product')

        curProduct = await api.products.create({
            name: newProduct.name,
            active: true,
            description: newProduct.description,
            images: newProduct.images,
            metadata: { firestoreId: newProduct.id },
            shippable: true,
            type: 'good',
            url: `https://localhost:4200/merch/proizvod/${newProduct.slug}`,
            // non taxable https://stripe.com/docs/tax/tax-categories 
            tax_code: 'txcd_00000000',
        });
    }
    // update product 
    else if (JSON.stringify(newProduct) !== curProduct.metadata.firestoreData) {
        logger.debug('Updating existing product')

        curProduct = await api.products.update(id, {
            name: newProduct.name,
            active: true,
            description: newProduct.description,
            images: newProduct.images,
            metadata: { firestoreId: newProduct.id, firestoreData: JSON.stringify(newProduct) },
            shippable: true,
            url: `https://localhost:4200/merch/proizvod/${newProduct.slug}`,
            // non taxable https://stripe.com/docs/tax/tax-categories 
            tax_code: 'txcd_00000000',
        });

        map.delete(id);
    }

    return curProduct;
}

async function syncPrice(id: string, curPrice: Stripe.Price, curProduct: Stripe.Product, newPrice: StripePrice, map: Map<string, Stripe.Price>) {
    map.delete(id);

    // archive existing
    logger.debug('Archiving price');
    curPrice && await api.prices.update(id, { active: false });

    // create new
    logger.debug('Creating price and assigning to product')
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

async function saveCatalogInStore(snoutsCatalog: Map<SnoutsProductId, SnoutsProduct>) {
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