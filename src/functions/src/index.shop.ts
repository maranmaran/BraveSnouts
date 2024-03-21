import { createCheckoutSessionFn } from "./functions/shop/create-checkout-session.function";
import { setProductCatalogFn } from "./functions/shop/set-product-catalog.function";

export const setProductCatalog = setProductCatalogFn;
export const createCheckoutSession = createCheckoutSessionFn;
