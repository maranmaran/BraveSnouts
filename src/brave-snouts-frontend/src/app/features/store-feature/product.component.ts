import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { Product, StripeApi } from './stripe.api';

@Component({
  selector: 'app-product',
  styleUrls: ['./store.styles.scss'],
  styles: [
    `
      :host { @apply flex justify-center items-center h-full }
    `
  ],
  template: `
    <div *ngIf="product$ | async as product" class="grid grid-cols-2 sm:grid-cols-1 justify-center align-center gap-12">
        <img
            class="w-full h-full"
            [src]="product.images[0]"
        />

        <div class="grid grid-rows-[min-content,1fr,1fr] gap-4 h-full">
          <div class="flex flex-row justify-between gap-8">
            <span class="font-bold text-lg">{{ product.name }}</span>
            <span class="font-bold text-xl">{{ product.price.amount }} {{ product.price.currency | uppercase }}</span> 
          </div> 
          <div>{{ product.description }}</div> 
          <button mat-raised-button color="primary" class="justify-self-end self-end" (click)="buy(product)">
            Kupi ({{ product.price.amount }} {{ product.price.currency | uppercase }})
          </button> 
        </div> 
    </div>
  `
})
export class ProductComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StripeApi);

  product$ = this.api.selectedProduct$;

  ngOnInit() {
    this.ensureLoaded();
  }

  private ensureLoaded() {
    if (!this.api.selectedProduct) {
      const id = this.route.snapshot.params.id;
      this.api.getProduct(id)
        .pipe(first())
        .subscribe({
          next: product => this.api.selectProduct(product),
          error: _ => this.router.navigate(['merch'])
        });
    }
  }

  async buy(product: Product) {
    const quantity = window.prompt('Koliku kolicinu', "1");
    if (!window.confirm('Jeste li sigurni item za kolicinu total?')) {
      return;
    }

    // check if number quantity

    await this.api.checkout(product.price.id, parseInt(quantity));
  }
}
