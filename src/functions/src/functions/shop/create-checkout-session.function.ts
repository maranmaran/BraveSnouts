import { Stripe } from "stripe";
import { appConfig, europeFunctions } from "../app";

interface LineItem {
    productId: string,
    priceId: string,
    total: number;
    price: number,
    quantity: number,
    product: { name: string, image: string, slug: string };
};

type Cart = LineItem[];


let _api: Stripe = undefined;

const api = () => {
    if (_api) return _api;

    _api = new Stripe(appConfig().stripe.secret, {
        apiVersion: "2022-11-15"
    });

    return _api;
}


export const createCheckoutSessionFn = europeFunctions().https
    .onCall(async (data, ctx) => {
        const cart = data as Cart;
        await reserveInventory(cart);
        return await createCheckoutSessionId(cart);
    })

async function reserveInventory(cart: Cart) {
    return Promise.resolve();
}


async function createCheckoutSessionId(cart: Cart) {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map(
        c => ({
            price_data: {
                product_data: {
                    name: c.product.name,
                    description: "Test description",
                    images: [c.product.image]
                },
                unit_amount: c.price * 100,
                currency: "eur",
                tax_behavior: "exclusive",
            },
            quantity: c.quantity
        })
    )

    return await api().checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        payment_method_types: ['card'],
        cancel_url: `${appConfig().base.url}/merch/kosarica`,
        success_url: `${appConfig().base.url}/merch/placanje-uspjesno`,
        expires_at: Math.floor(Date.now() / 1000) + (3600 * 2), // 2 hours
        custom_text: {
            shipping_address: {
                message: 'Dostavna adresa',
            },
            submit: { message: 'Doniraj!' }
        },
        shipping_address_collection: {
            allowed_countries: [
                'HR',
            ]
        }
    });
} 