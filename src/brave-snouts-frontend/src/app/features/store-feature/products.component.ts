import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product, StoreApi } from './store.api';

@Component({
  selector: 'app-products',
  styles: [`
    :host { @apply flex flex-col }
    .animation { @apply transition-all duration-500 }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
        <mat-card *ngFor="let product of products$ | async" (click)="navigate(product)" class="
            group animation max-w-xl w-full h-full justify-self-center relative
            shadow-lg rounded-b-md flex justify-start p-0 
            cursor-pointer hover:shadow-2xl
          ">
            <!-- TODO: NG GALLERY --->
            <div class="w-full h-[250px] group-hover:h-[205px] self-center bg-cover bg-no-repeat animation"
            [ngStyle]="{
              background: 'url(' + product.variations[0].images[0] + ')',
            }" mat-card-image ></div>
            
            <mat-card-header class="px-3 pt-5 pb-4 justify-between gap-12">
              <mat-card-title class="font-bold text-lg">{{product.name}}</mat-card-title>
              <div>{{ product.price }} {{ product.currency | uppercase }} </div>
            </mat-card-header>
      
            <div class="flex flex-row">
              <span *ngFor="let variation of product.variations"
                class="rounded-full h-4 w-4 m-2" 
                [ngStyle]="{ backgroundColor: variation.colorCode }"
              ></span>
            </div> 

            <!-- <span class="p-4 text-sm" *ngIf="product.description" [innerHTML]="product.description"></span> -->
            <button mat-stroked-button color="primary" class="absolute w-full mt-auto bottom-0 invisible group-hover:visible delay-0 group-hover:delay-200 animation">Kupi</button>
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