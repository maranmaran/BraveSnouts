import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { StoreApi } from './store.api';

@Component({
    selector: 'store-container',
    template: `
        <app-toolbar></app-toolbar>
        <div class="container flex flex-col gap-4 px-4">
            <div *ngIf="!atCheckout" class="w-full flex justify-end pr-4" routerLink="/merch/kosarica">
                <button mat-raised-button color="primary">
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

    readonly cartCount$ = inject(StoreApi).cart$.pipe(map(x => x.length));
    get atCheckout() { return this.router.url.indexOf('kosarica') != -1 }
}
