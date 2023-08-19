import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, filter, takeUntil, tap } from 'rxjs'
import { Product, ProductVariation, StoreApi } from './store.api'

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
            <!--NG GALLERY-->
            <img class="w-full h-auto self-center shadow-md" [src]="product.variations[0].images[0]" />

            <form *ngIf="form" [formGroup]="form" class="grid grid-rows-[min-content,1fr,1fr] gap-12 h-full">
                <div class="flex flex-row justify-between gap-8">
                    <span class="font-bold text-lg">{{ product.name }}</span>
                    <span class="font-bold text-xl">{{ product.price }} {{ product.currency | uppercase }}</span>
                </div>
                <div *ngIf="product.description">{{ product.description }}</div>

                <div class="flex flex-col gap-4">
                  <div class="flex flex-row gap-8">
                      <mat-slider
                          class="w-full"
                          min="0"
                          [max]="product?.sizes?.length - 1 ?? 6"
                          step="1"
                          showTickMarks
                          discrete
                          [displayWith]="sizeThumbLabel.bind(this)"
                      >
                          <input #slider matSliderThumb formControlName="size" />
                      </mat-slider>
                      <span class="font-bold self-center  ml-auto">{{ sizeThumbLabel(slider.value) }}</span>
                  </div>
  
                  <div class="w-full flex flex-row h-10 justify-start items-center">
                      <div *ngFor="let variation of product.variations" 
                        (click)="selectVariation(variation)"
                        [matTooltip]="variation.colorName "
                        class="rounded-full h-8 w-8 cursor-pointer m-4 transition-all duration-150
                               hover:brightness-95 outline-solid outline border-solid border-4"
                        [ngStyle]="{
                          backgroundColor: variation.colorCode,
                          outlineColor: form.controls.variation?.value === variation ? variation.colorCode : 'transparent',
                          borderColor: form.controls.variation?.value === variation ? 'white' : 'transparent'
                        }"></div>
                        <span class="font-bold self-center ml-auto">{{ form.controls.variation.value.colorName | titlecase }}</span>
                  </div>
                </div>

                <button mat-raised-button color="primary" class="justify-self-end self-end" (click)="buy(product)">
                    Dodaj u košaricu ({{ product.price }} {{ product.currency | uppercase }})
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

  protected form: FormGroup
  readonly product$ = this.api.selectedProduct$.pipe(
    filter(x => !!x),
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

  createForm(product: Product) {
    return this.fb.group({
      quantity: this.fb.control(1, Validators.required),
      size: this.fb.control(product.sizes.length / 2, Validators.required),
      variation: this.fb.control(product.variations[0], Validators.required),
    })
  }

  async buy(product: Product) {
    if (!this.form.valid) {
      return;
    }

    const sizeIdx = this.form.value.size;
    const variationIdx = product.variations.indexOf(this.form.value.variation);
    const stripeProduct = product.stripeProducts.find(x =>
      x.sizeIdx == sizeIdx && x.variationIdx == variationIdx
    );

    this.api.addToCart({
      productId: stripeProduct.stripePriceId,
      priceId: stripeProduct.stripePriceId,
      price: product.price,
      currency: product.currency,
      quantity: 1,
      name: stripeProduct.stripeProductName,
      image: (this.form.value.variation as ProductVariation).images[0],
      total: product.price
    })
  }

  selectVariation(variation: ProductVariation) {
    this.form.controls.variation.setValue(variation);
  }

  sizeThumbLabel(idx: number | string) {
    return this.api?.selectedProduct ? this.api.selectedProduct.sizes[idx] : ''
  }
}
