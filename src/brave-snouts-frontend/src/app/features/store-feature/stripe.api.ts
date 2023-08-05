import { Injectable } from "@angular/core";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, first, firstValueFrom, from, map, of, shareReplay, switchMap, tap } from "rxjs";
import { environment } from "src/environments/environment";
import Stripe from "stripe";

export interface Price {
    id: string,
    amount: number,
    currency: string;
}

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

@Injectable()
export class StripeApi {

    // THIS NEEDS TO GO IN FUNCTIONS -- STORE SECURELY
    private readonly api = new Stripe(environment.stripe.secretKey, {
        apiVersion: "2022-11-15"
    });

    private readonly productsSubject = new BehaviorSubject<Product[]>([]);
    readonly products$ = this.productsSubject.asObservable().pipe(shareReplay(1));

    private readonly selectedProductSubject = new BehaviorSubject<Product>(null);
    selectedProduct$ = this.selectedProductSubject.asObservable().pipe(shareReplay(1));
    get selectedProduct() { return this.selectedProductSubject.value };

    async checkout(priceId: string, quantity: number) {
        // Call your backend to create the Checkout session.
        // When the customer clicks on the button, redirect them to Checkout.
        const stripe = await loadStripe(environment.stripe.publishableKey);
        const { error } = await stripe.redirectToCheckout({
            mode: "payment",
            lineItems: [{ price: priceId, quantity: quantity }],
            successUrl: `${window.location.href}/payment-success`,
            cancelUrl: `${window.location.href}/payment-failure`,
        });
        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `error.message`.
        if (error) {
            console.log(error);
            // toast
        }
    }

    selectProduct(product: Product) {
        this.selectedProductSubject.next(product);
    }

    getProduct(id: string) {
        if (this.productsSubject.value.length > 0) {
            return of(this.productsSubject.value.find(x => x.id === id));
        }

        return this.getProducts().pipe(
            map(x => x.find(x => x.id === id))
        );
    }

    getProducts() {
        if (this.productsSubject.value.length > 0) {
            return this.products$;
        }

        const call = this.api.products.list({
            active: true,
        });

        return from(call)
            .pipe(
                first(),
                map(products => (products as Stripe.Response<Stripe.ApiList<Stripe.Product>>).data),
                switchMap(async products => Promise.all(products.map(async x => await this.toProduct(x)))),
                map(products => products.sort((a, b) => a.created < b.created ? 1 : -1)),
                tap(products => this.productsSubject.next(products))
            );
    }

    getPrice(id: string) {
        const call = this.api.prices.retrieve(id, {});

        return from(call)
            .pipe(
                first(),
                map(price => (<Price>{
                    id: price.id,
                    currency: price.currency,
                    amount: price.unit_amount / 100,
                }))
            )

    }

    private async toProduct(entry: Stripe.Product) {
        return <Product>{
            id: entry.id,
            name: entry.name,
            url: entry.url,
            caption: entry.caption,
            created: entry.created,
            description: entry.description,
            price: await firstValueFrom(this.getPrice(entry.default_price as string)),
            images: entry.images,
            metadata: entry.metadata,
        }
    }
}

