import Stripe from "stripe";
import { Product } from "./stripe.models";
export declare const getProductsFn: import("firebase-functions/v1").HttpsFunction & import("firebase-functions/v1").Runnable<any>;
export declare function toProduct(entry: Stripe.Product): Promise<Product>;
