import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { StoreApi } from './store.api';

@Component({
    selector: 'store-home',
    styles: [`
        .container {
            height: calc(100% - 66px - 1rem) !important;
        }
    `],
    template: `
        <app-toolbar></app-toolbar>
        <div class="container flex flex-col gap-4 px-4 sm:px-2">
            <div class="flex flex-row flex-wrap gap-2 justify-between">
                <mat-button-toggle-group *ngIf="atList" class="justify-self-start self-center mx-2 min-w-fit" value="man" (valueChange)="onTabChange($event)">
                    <mat-button-toggle value="man">Muškarci</mat-button-toggle>
                    <mat-button-toggle value="woman">Žene</mat-button-toggle>
                    <mat-button-toggle value="child">Djeca</mat-button-toggle>
                    <mat-button-toggle value="item">Ostalo</mat-button-toggle>
                </mat-button-toggle-group>  

                <button *ngIf="renderBack" (click)="navigateBack()" class="btn-small justify-self-start self-center mx-2 min-w-fit" mat-raised-button color="warn">
                    <mat-icon>arrow_back</mat-icon>
                    Natrag
                </button>
    
                <button *ngIf="!atCheckout" class="btn-small justify-self-end self-center mx-2 min-w-fit" mat-raised-button color="primary" routerLink="/merch/kosarica">
                    <mat-icon matPrefix>shopping_cart</mat-icon>
                    Košarica
                    {{ (cartCount$ | async) > 0 ? (cartCount$ | async) : 0 }}
                </button>
            </div>
            <router-outlet></router-outlet>
        </div>
    `,
})
export class StoreHomeComponent {
    private readonly router = inject(Router);
    private readonly api = inject(StoreApi);

    readonly cartCount$ = this.api.cart$.pipe(map(x => x.length));

    get atList() { return this.router.url == '/merch' }
    get atCheckout() { return this.router.url == "/merch/kosarica" }
    get renderBack() { return this.router.url.startsWith('/merch/proizvod') || this.atCheckout }

    navigateBack() {
        history.back();
    }

    onTabChange(value: string) {
        if (value == "item") {
            return this.api.setFilter(x => x.type == "item");
        }

        // must be gender..
        return this.api.setFilter(x => x.gender == value);
    }
}
