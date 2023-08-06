import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutSuccessComponent } from './checkout-success.component';
import { ProductComponent } from './product.component';
import { ProductsComponent } from './products.component';
import { StoreHomeComponent } from './store-home.component';

const routes: Routes = [
    {
        path: '', component: StoreHomeComponent, children: [
            { path: '', component: ProductsComponent },
            { path: 'proizvod/:id', component: ProductComponent, pathMatch: 'prefix' },
            { path: 'placanje-uspjesno', component: CheckoutSuccessComponent, pathMatch: 'full' },
        ]
    },
    { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class StoreRoutingModule { }
