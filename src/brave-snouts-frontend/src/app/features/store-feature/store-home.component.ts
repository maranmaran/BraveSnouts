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
                <mat-button-toggle-group *ngIf="atList" class="self-start mx-2 min-w-fit" value="Muska">
                    <mat-button-toggle value="Muska">Muškarci</mat-button-toggle>
                    <mat-button-toggle value="Zenska">Žene</mat-button-toggle>
                    <mat-button-toggle value="Djecja">Djeca</mat-button-toggle>
                </mat-button-toggle-group>  

                <button *ngIf="renderBack" (click)="navigateBack()" class="btn-small self-start mx-2 min-w-fit" mat-raised-button color="warn">
                    <mat-icon>arrow_back</mat-icon>
                    Natrag
                </button>
    
                <button *ngIf="!atCheckout" class="btn-small self-end mx-2 min-w-fit" mat-raised-button color="primary" routerLink="/merch/kosarica">
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

    get atList() { return this.router.url == '/merch' }
    get atCheckout() { return this.router.url == "/merch/kosarica" }
    get renderBack() { return this.router.url.startsWith('/merch/proizvod') || this.atCheckout }

    navigateBack() {
        history.back();
    }
}
