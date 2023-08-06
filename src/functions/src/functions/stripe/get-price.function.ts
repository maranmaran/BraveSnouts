import Stripe from "stripe";
import { config, europeFunctions } from "../..";
import { Price } from "./stripe.models";

const api = new Stripe(config.stripe.secret, {
    apiVersion: "2022-11-15"
});

export const getPriceFn = europeFunctions.https.onCall(
    async (id, context) => await getPriceInternal(id)
)

export async function getPriceInternal(id: string) {
    const price = await api.prices.retrieve(id, {});

    return <Price>{
        id: price.id,
        currency: price.currency,
        amount: price.unit_amount / 100,
    }
}
