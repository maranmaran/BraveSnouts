import { createCheckoutSessionFn } from "./functions/shop/create-checkout-session.function";
import { setProductCatalogFn, setProductCatalogHttpFn } from "./functions/shop/set-product-catalog.function";

export const setProductCatalog = setProductCatalogFn;
export const createCheckoutSession = createCheckoutSessionFn;

// TODO: Remove
export const setProductCatalogHttp = setProductCatalogHttpFn;
