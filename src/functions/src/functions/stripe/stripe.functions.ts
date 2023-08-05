import Stripe from "stripe";
import { config, europeFunctions } from "../..";
import { Price, Product } from "./stripe.models";

const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

export const getProducts = europeFunctions.https.onCall(
    async (_, context) => {
        const stripeProducts = await api.products.list({
            active: true,
        });

        let products: Product[] = [];
        for (const product of stripeProducts.data) {
            products.push(await toProduct(product));
        }

        products = products.sort((a, b) => a.created < b.created ? 1 : -1);

        return products;
    }
)

export const getPrice = europeFunctions.https.onCall(
    async (id, context) => await getPriceInternal(id)
)

async function getPriceInternal(id: string) {
    const price = await api.prices.retrieve(id, {});

    return <Price>{
        id: price.id,
        currency: price.currency,
        amount: price.unit_amount / 100,
    }
}

async function toProduct(entry: Stripe.Product) {
    return <Product>{
        id: entry.id,
        name: entry.name,
        url: entry.url,
        caption: entry.caption,
        created: entry.created,
        description: entry.description,
        price: await getPriceInternal(entry.default_price as string),
        images: entry.images,
        metadata: entry.metadata,
    }
}