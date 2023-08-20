import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSliderModule } from "@angular/material/slider";
import { MatTooltipModule } from "@angular/material/tooltip";
import { GalleryModule } from "ng-gallery";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { CartComponent } from "./cart.component";
import { CheckoutSuccessComponent } from "./checkout-success.component";
import { ProductComponent } from './product.component';
import { ProductsComponent } from './products.component';
import { StoreHomeComponent } from './store-home.component';
import { StoreRoutingModule } from './store-routing.module';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        StoreRoutingModule,
        ToolbarComponent,

        GalleryModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSliderModule,
        MatTooltipModule,
        MatInputModule,
        MatButtonToggleModule,
    ],
    declarations: [
        StoreHomeComponent,

        CartComponent,
        ProductComponent,
        ProductsComponent,
        CheckoutSuccessComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: []
})
export class StoreModule { }
