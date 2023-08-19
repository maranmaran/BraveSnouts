import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product, StoreApi } from './store.api';

@Component({
  selector: 'app-products',
  styles: [`
    :host { @apply flex flex-col }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
        <mat-card *ngFor="let product of products$ | async" (click)="navigate(product)" class="
            max-w-xl w-full h-full justify-self-center relative
            shadow-lg rounded-b-md flex justify-start p-0 
            transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
          ">
            <!-- TODO: NG GALLERY --->
            <div [ngStyle]="{
              background: 'url(' + product.variations[0].images[0] + ') 50% 50% no-repeat',
                'background-size': 'cover',
                'align-self': 'center',
                'height': '250px',
                'width': '100%'
            }" mat-card-image ></div>
            <mat-card-header class="px-3 pt-5 pb-4 justify-between gap-12">
              <mat-card-title class="font-bold text-lg">{{product.name}}</mat-card-title>
              <div>{{ product.price }} {{ product.currency | uppercase }} </div>
            </mat-card-header>
            <!-- <span class="p-4 text-sm" *ngIf="product.description" [innerHTML]="product.description"></span> -->
            <button mat-stroked-button class="relative bottom-0">Kupi</button>
        </mat-card>

    </div>
  `
})
export class ProductsComponent {
  private readonly router = inject(Router);
  private readonly api = inject(StoreApi);
  readonly products$ = this.api.products$;

  navigate(product: Product) {
    this.api.selectProduct(product);
    this.router.navigate(['merch', 'proizvod', product.slug])
  }
}