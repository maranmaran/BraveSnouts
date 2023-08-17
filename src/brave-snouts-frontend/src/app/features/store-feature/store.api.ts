import { Injectable, inject } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { HotToastService } from "@ngneat/hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, first, map, of, shareReplay, tap } from "rxjs";
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

export type LineItem = { productId: string, priceId: string, quantity: number };
type Cart = LineItem[];
const lineItemEq = (l: LineItem, r: LineItem) => l.productId == r.productId && l.priceId == r.priceId;

@Injectable({ providedIn: 'root' })
export class StoreApi {
    private readonly store = inject(AngularFirestore);
    private readonly toast = inject(HotToastService)

    private readonly productsSubject = new BehaviorSubject<Product[]>([]);
    readonly products$ = this.productsSubject.asObservable().pipe(shareReplay(1));

    private readonly selectedProductSubject = new BehaviorSubject<Product>(null);
    readonly selectedProduct$ = this.selectedProductSubject.asObservable().pipe(shareReplay(1));
    get selectedProduct() { return this.selectedProductSubject.value };

    private readonly cartSubject = new BehaviorSubject<Cart>(JSON.parse(localStorage.getItem('cart') ?? "[]"));
    readonly cart$ = this.cartSubject.asObservable()
        .pipe(
            tap(cart => {
                localStorage.setItem('cart', JSON.stringify(cart));
            }),
            shareReplay(1)
        );

    addToCart(item: LineItem) {
        const cart = this.cartSubject.value;
        const current = cart.find(x => lineItemEq(x, item));

        if (!current) {
            cart.push(item);
        } else {
            current.quantity += item.quantity;
        }

        this.cartSubject.next(cart);
    }

    updateCart(updatedItem: LineItem) {
        const cart = this.cartSubject.value.map(
            currentItem => lineItemEq(currentItem, updatedItem) ? updatedItem : currentItem
        );

        this.cartSubject.next(cart);
    }

    removeFromCart(item: LineItem) {
        const cart = this.cartSubject.value.map(
            currentItem => lineItemEq(currentItem, item) ? null : currentItem
        );

        console.debug(cart);

        this.cartSubject.next(cart);
    }

    async checkout() {
        const cart = this.cartSubject.value;

        // Call your backend to create the Checkout session.
        // When the customer clicks on the button, redirect them to Checkout.
        const stripe = await loadStripe(environment.stripe.publishableKey);
        const { error } = await stripe.redirectToCheckout({
            mode: "payment",
            lineItems: cart,
            successUrl: `${environment.baseUrl}/merch/placanje-uspjesno`,
            cancelUrl: `${environment.baseUrl}/merch`,
        });

        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `error.message`.
        if (error) {
            this.toast.error('Nešto je pošlo po zlu prilikom kupovine');
            console.error(error);
        }

        this.cartSubject.next([]);
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

        return this.store.collection<Product>('shop')
            .valueChanges()
            .pipe(
                first(),
                tap(products => this.productsSubject.next(products))
            );
    }
}

