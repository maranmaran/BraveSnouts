import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { GalleryModule } from "ng-gallery";
import { AuctionsToolbarComponent } from "src/app/features/auction-feature/auctions-toolbar/auctions-toolbar.component";
import { WebHomeComponent } from "./web-home.component";
import { WebRoutingModule } from "./web-routing.module";

@NgModule({
    imports: [
        CommonModule,
        WebRoutingModule,
        AuctionsToolbarComponent,

        GalleryModule
    ],
    declarations: [
        WebHomeComponent,
    ],
    providers: []
})
export class WebModule { }
