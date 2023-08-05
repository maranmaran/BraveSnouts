import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { GalleryModule } from "ng-gallery";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
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
    ],
    providers: []
})
export class StoreModule { }
