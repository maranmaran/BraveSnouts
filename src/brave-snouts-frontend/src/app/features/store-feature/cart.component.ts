import { Component, inject } from '@angular/core';
import { LineItem, StoreApi } from './store.api';

@Component({
  selector: 'app-cart',
  styleUrls: ['./store.styles.scss'],
  styles: [
    `
      :host { @apply flex justify-center items-center h-full }
    `
  ],
  template: `
    
  `
})
export class CartComponent {
  private readonly api = inject(StoreApi);

  readonly cart$ = this.api.cart$;

  changeQuantity(item: LineItem, quantity: number) {
    item.quantity = quantity;
    this.api.updateCart(item);
  }

  removeFromCart(item: LineItem) {
    this.api.removeFromCart(item);
  }
}
