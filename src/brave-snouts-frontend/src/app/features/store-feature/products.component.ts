import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product, StripeApi } from './stripe.api';

@Component({
  selector: 'app-products',
  styleUrls: ['./store.styles.scss'],
  styles: [`
    :host { @apply flex flex-col }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
        <mat-card *ngFor="let product of products$ | async" (click)="navigate(product)" class="
            max-w-xl justify-self-center
            shadow-lg rounded-b-md flex justify-start p-0 
            transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
          ">
            <mat-card-header class="px-3 pt-5 pb-4 justify-between gap-12">
              <mat-card-title class="font-bold text-lg">{{product.name}}</mat-card-title>
              <div>{{ product.price.amount }} {{ product.price.currency | uppercase }} </div>
            </mat-card-header>
            <div [ngStyle]="{
              background: 'url(' + product.images[0] + ') 50% 50% no-repeat',
                'background-size': 'cover',
                'align-self': 'center',
                'height': '250px',
                'width': '100%'
            }" mat-card-image ></div>
            <span class="p-4 text-sm" [innerHTML]="product.description"></span>
            <button mat-raised-button color="primary">Kupi</button>
        </mat-card>

    </div>
  `
})
export class ProductsComponent {
  private readonly router = inject(Router);
  readonly products$ = inject(StripeApi).getProducts();

  navigate(product: Product) {
    const id = product.id;
    this.router.navigate(['merch', id])
  }
}
