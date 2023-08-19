import { Injectable, inject } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { HotToastService } from "@ngneat/hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, first, map, of, shareReplay, tap } from "rxjs";
import { environment } from "src/environments/environment";

export interface Product {
    id: string;
    slug: string;
    name: string;
    active: string;
    price: number;
    currency: string;
    description: string;
    sizes: string[]
    variations: ProductVariation[];
    stripeProducts: StripeProduct[];
}

export interface ProductVariation {
    colorName: string;
    colorCode: string;
    images: string[]
}

export interface StripeProduct {
    sizeIdx: number;
    variationIdx: number;
    stripeProductId: string;
    stripePriceId: string;
    stripeProductName: string;
}

export interface LineItem {
    productId: string,
    priceId: string,
    total: number;
    price: number,
    quantity: number,
    currency: string,
    name: string;
    image: string;
};

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
            map(cart => {
                localStorage.setItem('cart', JSON.stringify(cart));

                // if not backward compatible, full reset
                if (!this.cartValid(cart)) {
                    localStorage.removeItem('cart');
                    this.cartSubject.next([]);
                    return [];
                }

                return cart;
            }),
            shareReplay(1)
        );

    cartValid(cart: Cart) {
        return cart.reduce((a, b) => a
            && !!b.currency
            && !!b.name
            && !!b.image
            && !!b.total
            && !!b.price
            && !!b.priceId
            && !!b.productId
            && !!b.quantity
            , true)
    }

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

    clearCart() {
        this.cartSubject.next([]);
    }

    async checkout() {
        const cart = this.cartSubject.value;

        // Call your backend to create the Checkout session.
        // When the customer clicks on the button, redirect them to Checkout.
        const stripe = await loadStripe(environment.stripe.publishableKey);
        const { error } = await stripe.redirectToCheckout({
            lineItems: cart.map(x => ({ price: x.priceId, quantity: x.quantity })),
            mode: "payment",
            submitType: 'donate',
            billingAddressCollection: 'required',
            shippingAddressCollection: { allowedCountries: ['HR'] },
            successUrl: `${environment.baseUrl}/merch/placanje-uspjesno`,
            cancelUrl: `${environment.baseUrl}/merch/kosarica`,
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

    getProduct(slug: string) {
        if (this.productsSubject.value.length > 0) {
            return of(this.productsSubject.value.find(x => x.slug === slug));
        }

        return this.products$.pipe(
            map(x => x.find(x => x.slug === slug))
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

