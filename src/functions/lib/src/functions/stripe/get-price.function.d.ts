import { Price } from "./stripe.models";
export declare const getPriceFn: import("firebase-functions/v1").HttpsFunction & import("firebase-functions/v1").Runnable<any>;
export declare function getPriceInternal(id: string): Promise<Price>;
