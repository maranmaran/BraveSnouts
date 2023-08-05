import { Injectable, inject } from "@angular/core";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, map, of, shareReplay } from "rxjs";
import { environment } from "src/environments/environment";

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
    private readonly functions = inject(AngularFireFunctions);

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

        return this.functions.httpsCallable<void, Product[]>('getProducts-getProductsFn')();
    }

    getPrice(id: string) {
        return this.functions.httpsCallable<string, Price>('getPrice-getPriceFn')(id);
    }
}

