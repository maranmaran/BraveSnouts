import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { HotToastService } from '@ngxpert/hot-toast'
import { Subject, filter, takeUntil, tap } from 'rxjs'
import { FirebaseFile } from 'src/business/models/firebase-file.model'
import { uniqueArray } from 'src/business/utils/unique-array.util'
import { Product, ProductVariation, StoreApi, shirtGenderDisplayName } from './store.api'

type ProductImages = FirebaseFile[];

interface ProductColor {
  colorName: string;
  colorCode: string;
}

interface ProductSize {
  size: string;
}

interface VariationId {
  color?: ProductColor;
  size?: ProductSize;
}

type VariationMap = Map<VariationId, ProductVariation>;

@Component({
  selector: 'app-product',
  styles: [
    `
            :host {
                @apply flex justify-center items-start h-full w-full;
            }
        `,
  ],
  template: `
        <div
            *ngIf="product$ | async as product"
            class="grid grid-cols-2 sm:grid-cols-1 justify-center align-center gap-12 
           w-[80vw] max-w-2xl sm:max-w-full sm:w-full"
        >
            <bs-media-gallery [media]="product.variations[0].images" [fullResolution]="true"></bs-media-gallery>
        
            <form *ngIf="form" [formGroup]="form" class="grid grid-rows-[min-content,1fr,1fr] gap-12 sm:gap-4 h-full">
                <div class="flex flex-row justify-between gap-8">
                    <span class="font-bold text-lg">{{ productName }}</span>
                    <span class="font-bold text-xl">{{ product.price }} €</span>
                </div>
                <div *ngIf="product.description">{{ product.description }}</div>

                <div class="flex flex-col gap-4">
                  <div *ngIf="sizes?.length > 0" class="flex flex-row gap-8">
                    <mat-form-field>
                      <mat-label>Veličina</mat-label>
                      <mat-select formControlName="size">
                        <mat-option *ngFor="let size of sizes" [value]="size">
                          {{ size.size | uppercase }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
  
                  <div *ngIf="colors?.length > 0" class="w-full flex flex-col h-10 justify-start items-start" >
                    <div class="font-bold self-start">{{ selectedColor?.colorName | titlecase }}</div>
                    <div class="flex flex-row flex-wrap">
                      <div *ngFor="let color of colors" 
                        (click)="selectColor(color)"
                        class="rounded-full h-8 w-8 cursor-pointer m-4 transition-all duration-150
                                hover:brightness-95 outline-solid outline border-solid"
                        [ngClass]="{
                          'drop-shadow-[0px_2px_6px_rgb(55,65,81)]': isSelectedColor(color),
                        }"
                        [ngStyle]="{
                          backgroundColor: color.colorCode,
                          borderWidth: isSelectedColor(color) ? '4px' : '2px',
                          borderColor: isSelectedColor(color) ? 'white' : 'lightgray',
                          outlineColor: isSelectedColor(color) ? color.colorCode : 'transparent',
                        }"></div>
                    </div>
                  </div>
                </div>

                <button mat-raised-button color="primary" class="justify-self-end self-end" [disabled]="!form.valid" (click)="buy(product)">
                    Dodaj u košaricu ({{ product.price }} €)
                </button>
            </form>
        </div>
    `,
})
export class ProductComponent implements OnInit, OnDestroy {
  private readonly ngUnsubscribeSubject = new Subject<void>()

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly api = inject(StoreApi)
  private readonly fb = inject(FormBuilder)
  private readonly toast = inject(HotToastService)

  protected form: FormGroup
  readonly product$ = this.api.selectedProduct$.pipe(
    filter(x => !!x),
    tap(p => this.indexData(p)),
    tap(p => (this.form = this.createForm(p))),
  )

  ngOnInit() {
    if (!this.api.selectedProduct) {
      const slug = this.route.snapshot.params.slug
      this.api
        .getProduct(slug)
        .pipe(takeUntil(this.ngUnsubscribeSubject))
        .subscribe({
          next: product => this.api.selectProduct(product),
          error: _ => this.router.navigate(['merch']),
        })
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribeSubject.next()
  }

  protected selectedColor: ProductColor;
  protected selectedSize: ProductSize;

  protected product: Product;
  protected productName: string;
  protected colors: ProductColor[] = [];
  protected sizes: ProductSize[] = [];

  protected sizeToColors = new Map<ProductSize, ProductColor[]>();

  isSelectedColor(color: ProductColor) {
    return this.selectedColor?.colorCode == color.colorCode;
  }

  isSelectedSize(size: ProductSize) {
    return this.selectedSize?.size == size.size;
  }

  findVariations(variations: ProductVariation[], color?: ProductColor, size?: ProductSize) {
    return variations.filter(x => {
      if (!color && !size) {
        return x;
      }
      if (!color && size) {
        return x.size == size.size;
      }
      if (color && !size) {
        return x.colorCode == color.colorCode;
      }
      return x.colorCode == color.colorCode && x.size == size.size;
    });
  }

  indexData(product: Product) {
    this.sizes = uniqueArray(product.variations.map(x => <ProductSize>(
      { size: x.size }))
    ).filter(x => !!x && Object.keys(x).length > 0);

    this.colors = uniqueArray(product.variations.map(x => <ProductColor>(
      { colorCode: x.colorCode, colorName: x.colorName }))
    ).filter(x => !!x && Object.keys(x).length > 0);

    for (const size of this.sizes) {
      const sizeColors = this.findVariations(product.variations, null, size);
      this.sizeToColors.set(size, sizeColors);
    }

    this.product = product;
    this.productName = `${product.name} ${shirtGenderDisplayName(product.gender)}`.trim()
  }

  createForm(product: Product) {
    // get variation from state when going back
    let size = this.sizes?.[0] ?? null;
    let color = size ? this.sizeToColors.get(size)[0] : null;

    // set from state if we're navigating here from cart
    // const stripeProductName = history.state.stripeProductName;
    // if (stripeProductName) {
    //   const stripeProduct = product.stripeProduct.find(x => x.stripeProductName == stripeProductName);

    //   size = stripeProduct.sizeIdx;
    //   variation = product.variations[stripeProduct.variationIdx];
    // }

    this.form = this.fb.group({
      quantity: this.fb.control(1, Validators.required),
      size: this.fb.control(size),
      color: this.fb.control(color),
    });

    this.form.controls.size.valueChanges
      .pipe(takeUntil(this.ngUnsubscribeSubject))
      .subscribe(x => this.selectSize(x));

    if (product.hasSizes) {
      this.selectSize(this.form.controls.size.value);
    }

    return this.form;
  }

  async buy(product: Product) {
    if (!this.form.valid) {
      return;
    }

    const variations = this.findVariations(this.product.variations, this.selectedColor, this.selectedSize);
    const variation = variations[0];

    const stripeProduct = product.stripe;

    const variationName = `${shirtGenderDisplayName(product.gender) ?? ''} ${variation.size ?? ''} ${variation.colorName ?? ''}`.trim();
    const variationProductName = `${product.name} ${variationName ?? ''}`.trim();

    this.api.addToCart({
      productId: stripeProduct.productId,
      priceId: stripeProduct.priceId,
      price: product.price,
      quantity: 1,
      total: product.price,
      product: { ...variation, slug: product.slug, name: variationProductName }
    })

    this.toast.success('Dodano u košaricu');
  }

  selectSize(size: ProductSize) {
    this.selectedSize = size;

    const availableColors = this.sizeToColors.get(size);
    this.colors = availableColors;

    this.selectColor(this.colors[0]);
  }

  selectColor(color: ProductColor) {
    this.selectedColor = color;
    this.form.controls.color.setValue(color);
  }

  sizeThumbLabel(idx: number | string) {
    return this.api?.selectedProduct ? this.sizes?.[idx]?.size ?? '' : ''
  }
}
