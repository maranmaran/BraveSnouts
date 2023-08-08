import Stripe from "stripe";
import { config, europeFunctions, store } from "../..";

export interface Product {
    id: string;
    name: string;
    url: string | null;
    caption?: string | null;
    created: number;
    description: string | null;
    price: Price,
    images: string[];
    metadata: { [name: string]: string; };
}

export interface Price {
    id: string,
    amount: number,
    currency: string;
}


const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

export const setProductsFn = europeFunctions.pubsub
    .schedule('0 */4 * * *') // every 4 hours
    .onRun(async () => {
        const stripeProducts = await api.products.list({
            active: true,
        });

        const writer = store.bulkWriter();

        for (const entry of stripeProducts.data) {
            const product = await toProduct(entry);
            writer.create(store.doc(`store-products/${product.id}`), product)
        }

        await writer.close();
    }
    )

export async function toProduct(entry: Stripe.Product) {
    return <Product>{
        id: entry.id,
        name: entry.name,
        url: entry.url,
        caption: entry.caption,
        created: entry.created,
        description: entry.description,
        price: await getPrice(entry.default_price as string),
        images: entry.images,
        metadata: entry.metadata,
    }
}

async function getPrice(id: string) {
    const price = await api.prices.retrieve(id, {});

    return <Price>{
        id: price.id,
        currency: price.currency,
        amount: price.unit_amount / 100,
    }
}