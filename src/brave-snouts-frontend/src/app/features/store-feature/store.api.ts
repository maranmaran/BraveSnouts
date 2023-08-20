import { Injectable, inject } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { HotToastService } from "@ngneat/hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { BehaviorSubject, first, firstValueFrom, map, of, shareReplay, tap } from "rxjs";
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { environment } from "src/environments/environment";

export const shirtGenderDisplayName = (gender: string) => {
    switch (gender) {
        case "man":
            return "Muška";
        case "women":
            return "Ženska";
        case "child":
            return "Dječja";
    }

    return "";
}

export interface Product {
    id: string;
    slug: string;
    name: string;
    type: string;
    gender?: string;
    active: string;
    price: number;
    description: string;
    stripe: StripeProduct,
    hasSizes: boolean;
    variations: ProductVariation[];
}

export interface ProductVariation {
    colorName: string;
    colorCode: string;
    images: FirebaseFile[],
    size?: string;
    stock: number;
}

export interface StripeProduct {
    productId: string;
    priceId: string;
}

export interface LineItem {
    productId: string,
    priceId: string,
    total: number;
    price: number,
    quantity: number,
    product: ProductVariation & { name: string, slug: string }
};

type Cart = LineItem[];
const lineItemEq = (l: LineItem, r: LineItem) => l.productId == r.productId && l.priceId == r.priceId;

@Injectable({ providedIn: 'root' })
export class StoreApi {
    private readonly store = inject(AngularFirestore);
    private readonly functions = inject(AngularFireFunctions);
    private readonly toast = inject(HotToastService)

    private readonly productsSubject = new BehaviorSubject<Product[]>([]);
    readonly products$ = this.productsSubject.asObservable()
        .pipe(
            map(p => p.filter(x => this.filter(x))),
            shareReplay(1)
        );

    private readonly selectedProductSubject = new BehaviorSubject<Product>(null);
    readonly selectedProduct$ = this.selectedProductSubject.asObservable().pipe(shareReplay(1));
    get selectedProduct() { return this.selectedProductSubject.value };

    private readonly cartSubject = new BehaviorSubject<Cart>(JSON.parse(localStorage.getItem('cart') ?? "[]"));
    readonly cart$ = this.cartSubject.asObservable()
        .pipe(
            map(cart =>
                cart.filter(x => !!x)
            ),
            map(cart => {
                for (const item of cart) {
                    this.calculateItemTotal(item);
                }
                return cart;
            }),
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
            && !!b.product
            && !!b.total
            && !!b.price
            && !!b.quantity
            && !!b.priceId
            && !!b.productId
            , true)
    }

    private filter: (p: Product) => boolean = x => x.gender == 'man';
    setFilter(filter: (p: Product) => boolean) {
        this.filter = filter;
        this.productsSubject.next(this.productsSubject.value);
    }

    calculateItemTotal(item: LineItem) {
        item.total = Math.round(item.price * item.quantity * 100) / 100;
        return item.total;
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
        ).filter(x => !!x);

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

        const sessionId = await firstValueFrom(this.functions.httpsCallable('shop-createCheckoutSession')(cart));

        const { error } = await stripe.redirectToCheckout({ sessionId });

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

        return this.getProducts().pipe(
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
                map(products => products.map(p => {
                    // remove 0 stocked variations
                    p.variations.map(v => v.stock == 0
                        ? null
                        : v
                    ).filter(x => !!x);

                    // check if we have any variations after former filtering
                    if (!p.variations || p.variations?.length == 0) {
                        return null;
                    }

                    // we're ok moving on...
                    return p;
                }).filter(x => !!x)
                ),
                tap(products => this.productsSubject.next(products))
            );
    }
}

