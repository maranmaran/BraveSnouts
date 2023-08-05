export interface Product {
    id: string;
    name: string;
    url: string | null;
    caption?: string | null;
    created: number;
    description: string | null;
    price: Price,
    images: string[];
    metadata: { [name: string]: string; };
}

export interface Price {
    id: string,
    amount: number,
    currency: string;
}
