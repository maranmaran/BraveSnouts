export type SnoutsProductId = string;
export interface SnoutsProduct {
    id: SnoutsProductId;
    slug: string;
    name: string;
    active: string;
    price: number;
    currency: string;
    description: string;
    sizes: string[]
    variations: {
        colorName: string;
        colorCode: string;
        images: string[]
    }[];
    stripeProducts?: {
        sizeIdx: number;
        variationIdx: number;

        stripeProductName: string;
        stripeProductId: StripeId;
        stripePriceId: StripeId;
    }[];
}

export type StripeId = string;
export type SnoutsProductVariationId = string;
export type SnoutsProductVariation = { id: string, sizeIdx: number, variationIdx: number, snoutsProductId: SnoutsProductId };

export interface StripeProduct {
    id: SnoutsProductVariationId;
    variation: SnoutsProductVariation;
    slug: string;
    name: string;
    description: string | null;
    images: string[];
    price: StripePrice
}

export interface StripePrice {
    id: string,
    amount: number,
    currency: string;
}
