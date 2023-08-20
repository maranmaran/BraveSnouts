import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { map } from 'rxjs'
import { LineItem, StoreApi } from './store.api'

@Component({
  selector: 'app-cart',
  styles: [
    `
            :host {
                @apply flex justify-center items-center h-full;
            }
        `,
  ],
  template: `
        <div class="grid grid-cols-3 gap-8 md:grid-cols-1 w-full">
            <div id="items" class="col-span-2 flex flex-col gap-8 overflow-auto h-[75vh] md:order-2 w-full sm:p-2">
                <div
                    *ngFor="let item of cart$ | async"
                    class="p-4 shadow-md w-[90%] flex flex-row gap-16 sm:gap-4 sm:flex-col hover:shadow-lg"
                >
                    <img
                        class="w-24 h-fit self-center cursor-pointer hover:shadow-2xl"
                        [src]="item.product.image"
                        (click)="navigateProduct(item.product.slug, item.product.name)"
                    />
                    <div class="flex flex-col">
                        <div class="font-bold mb-4">{{ item.product.name }}</div>
                        <div class="text-sm">
                            Količina:
                            <span>
                                <mat-form-field class="scale-[0.8] w-[115px]">
                                    <input
                                        #quantity
                                        matInput
                                        type="number"
                                        [value]="item.quantity"
                                        [step]="1"
                                        min="0"
                                        pattern="d+"
                                        onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                                        (input)="changeQuantity(item, quantity)"
                                    />
                                </mat-form-field>
                            </span>
                        </div>
                        <div class="text-sm">Jedinična cijena: {{ item.price }} €</div>
                        <div class="self-end mt-4"><span class="font-bold">Ukupno:</span> {{ item.total }} €</div>
                    </div>
                </div>
            </div>
            <div id="actions" class="md:order-1">
                <button mat-raised-button (click)="clear()">Očisti</button>
                <button mat-raised-button (click)="buy()">Kupi ({{ total$ | async }} €)</button>
            </div>
            <!-- <pre>{{ cart$ | async | json }}</pre> -->
        </div>
    `,
})
export class CartComponent {
  private readonly api = inject(StoreApi)
  private readonly router = inject(Router)

  readonly cart$ = this.api.cart$
  readonly total$ = this.api.cart$.pipe(
    map(cart => cart.reduce((a, b) => (a += b.price * 100 * b.quantity), 0)),
    map(total => Math.round(total) / 100),
  )

  changeQuantity(item: LineItem, input: HTMLInputElement) {
    const quantity = Number.parseInt(input.value)

    if (Number.isNaN(quantity) || quantity <= 0) {
      if (!window.confirm(`Sigurno želite maknuti ${item.product.name} iz košarice?`)) {
        input.value = item.quantity.toString()
        return
      }

      this.removeFromCart(item)
    }

    item.quantity = quantity
    this.api.updateCart(item)
  }

  removeFromCart(item: LineItem) {
    this.api.removeFromCart(item)
  }

  clear() {
    this.api.clearCart()
  }

  buy() {
    this.api.checkout()
  }

  navigateProduct(slug: string, stripeProductName: string) {
    this.router.navigate(['/merch', 'proizvod', slug], { state: { stripeProductName } })
  }
}
