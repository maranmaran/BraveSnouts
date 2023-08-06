import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { GalleryModule } from "ng-gallery";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { CheckoutSuccessComponent } from "./checkout-success.component";
import { ProductComponent } from './product.component';
import { ProductsComponent } from './products.component';
import { StoreHomeComponent } from './store-home.component';
import { StoreRoutingModule } from './store-routing.module';

@NgModule({
    imports: [
        CommonModule,
        StoreRoutingModule,
        ToolbarComponent,

        GalleryModule,
        MatCardModule,
        MatButtonModule,
    ],
    declarations: [
        StoreHomeComponent,

        ProductComponent,
        ProductsComponent,
        CheckoutSuccessComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: []
})
export class StoreModule { }
