// import Stripe from "stripe";
// import { config, europeFunctions, store } from "../app";

// interface Product {
//     id: string;
//     name: string;
//     url: string | null;
//     caption?: string | null;
//     created: number;
//     description: string | null;
//     price: Price,
//     images: string[];
//     metadata: { [name: string]: string; };
// }

// interface Price {
//     id: string,
//     amount: number,
//     currency: string;
// }

// const api = new Stripe(config.stripe.secret, {
//     apiVersion: "2022-11-15"
// });

// export const setShopProductsFn = europeFunctions.pubsub
//     .schedule('0 */4 * * *') // every 4 hours
//     .onRun(async () => {
//         const stripeProducts = await api.products.list({
//             active: true,
//         });

//         await store.recursiveDelete(store.collection('shop'));

//         const writer = store.bulkWriter();

//         for (const entry of stripeProducts.data) {
//             const product = await toProduct(entry);
//             // eslint-disable-next-line @typescript-eslint/no-floating-promises
//             writer.create(store.doc(`shop/${product.id}`), product)
//         }

//         await writer.close();
//     })

// async function toProduct(entry: Stripe.Product) {
//     return <Product>{
//         id: entry.id,
//         name: entry.name,
//         url: entry.url,
//         caption: entry.caption,
//         created: entry.created,
//         description: entry.description,
//         price: await getPrice(entry.default_price as string),
//         images: entry.images,
//         metadata: entry.metadata,
//     }
// }

// async function getPrice(id: string) {
//     const price = await api.prices.retrieve(id, {});

//     return <Price>{
//         id: price.id,
//         currency: price.currency,
//         amount: price.unit_amount / 100,
//     }
// }