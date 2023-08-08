import { Injectable, inject } from "@angular/core";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { HotToastService } from "@ngneat/hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, map, of, shareReplay, tap } from "rxjs";
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

@Injectable({ providedIn: 'root' })
export class StoreApi {
    private readonly functions = inject(AngularFireFunctions);
    private readonly toast = inject(HotToastService)

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
            successUrl: `${environment.baseUrl}/merch/placanje-uspjesno`,
            cancelUrl: `${environment.baseUrl}/merch`,
        });

        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `error.message`.
        if (error) {
            this.toast.error('Nešto je pošlo po zlu prilikom kupovine');
            console.debug(error);
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

        return this.functions.httpsCallable<void, Product[]>('getStoreProducts-getStoreProductsFn')().pipe(
            tap(products => this.productsSubject.next(products))
        );
    }
}

