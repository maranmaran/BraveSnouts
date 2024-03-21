import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { uniqueArray } from 'src/business/utils/unique-array.util';
import { Product, StoreApi } from './store.api';

@Component({
  selector: 'app-products',
  styles: [`
    :host { @apply flex flex-col }
    .animation { @apply transition-all duration-[250ms] }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
        <mat-card *ngFor="let product of products$ | async" (click)="navigate(product)" class="
            group animation max-w-xl w-[280px] h-full justify-self-center relative
            shadow-lg rounded-b-md flex justify-start p-0 rounded overflow-hidden
            cursor-pointer hover:shadow-2xl
          ">
            <media-gallery class="w-full h-[250px] group-hover:h-[205px] group-hover:scale-110
              self-center bg-cover bg-no-repeat animation" 
              [media]="getImages(product)"
              [maxResolution]="true"
            ></media-gallery>
            
            <div class="animation group-hover:pb-12">
              <mat-card-header class="px-3 pt-5 pb-4 justify-between gap-12">
                <mat-card-title class="font-bold text-lg">{{product.name}}</mat-card-title>
                <div>{{ product.price }} €</div>
              </mat-card-header>
        
              <div class="flex flex-row">
                <span *ngFor="let color of getColors(product)"
                  class="rounded-full h-4 w-4 m-2 border-[0.2px] border-solid border-gray-400 shadow-md" 
                  [ngStyle]="{ backgroundColor: color.colorCode }"
                ></span>
              </div>
      
              <button class="w-full absolute bottom-0 opacity-0 hidden group-hover:block group-hover:opacity-100 transition-all duration-[250ms]" mat-raised-button (click)="navigate(product)">Kupi ({{ product.price }} €)</button>
            </div>  
        </mat-card>

    </div>
  `
})
export class ProductsComponent {
  private readonly router = inject(Router);
  private readonly api = inject(StoreApi);
  readonly products$ = this.api.products$;

  getImages(product: Product) {
    return product.variations.flatMap(x => x.images);
  }

  getColors(product: Product) {
    return uniqueArray(product.variations.map(x => (
      { colorCode: x.colorCode, colorName: x.colorName }))
    ).filter(x => !!x && Object.keys(x).length > 0);
  }

  navigate(product: Product) {
    this.api.selectProduct(product);
    this.router.navigate(['merch', 'proizvod', product.slug])
  }
}