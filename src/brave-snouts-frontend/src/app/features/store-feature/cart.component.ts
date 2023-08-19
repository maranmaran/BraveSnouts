import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { LineItem, StoreApi } from './store.api';

@Component({
  selector: 'app-cart',
  styles: [
    `
      :host { @apply flex justify-center items-center h-full }
    `
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div *ngFor="let item of cart$ |async" class="flex flex-row gap-4">
        <img [src]="item.image" class="w-24 h-auto"/>
        <div class="flex flex-col  font-bold">
            <div>{{ item.name }}</div> 
            <div class="self-end">{{ item.total }} €</div> 
        </div>
      </div> 
    <button mat-raised-button (click)="clear()">Očisti</button>
    <button mat-raised-button (click)="buy()">Kupi ({{total$ | async}} €)</button>
    <!-- <pre>{{ cart$ | async | json }}</pre> -->
  `
})
export class CartComponent {
  private readonly api = inject(StoreApi);

  readonly cart$ = this.api.cart$;
  readonly total$ = this.api.cart$.pipe(
    map(cart => cart.reduce((a, b) => a += b.price * 100 * b.quantity, 0)),
    map(total => Math.round(total) / 100)
  );

  changeQuantity(item: LineItem, quantity: number) {
    item.quantity = quantity;
    this.api.updateCart(item);
  }

  removeFromCart(item: LineItem) {
    this.api.removeFromCart(item);
  }

  clear() {
    this.api.clearCart();
  }

  buy() {
    this.api.checkout();
  }
}
