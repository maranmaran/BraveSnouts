import Stripe from "stripe";
import { config, europeFunctions } from "../..";
import { getPriceInternal } from "./get-price.function";
import { Product } from "./stripe.models";

const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

export const getProductsFn = europeFunctions.https.onCall(
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

export async function toProduct(entry: Stripe.Product) {
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