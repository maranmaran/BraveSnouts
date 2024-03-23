import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AuctionsToolbarComponent } from "src/app/features/auction-feature/auctions-toolbar/auctions-toolbar.component";
import { MediaGalleryModule } from "src/app/shared/media-gallery/media-gallery.component";
import { WebHomeComponent } from "./web-home.component";
import { WebRoutingModule } from "./web-routing.module";

@NgModule({
    imports: [
        CommonModule,
        WebRoutingModule,
        AuctionsToolbarComponent,

        MediaGalleryModule
    ],
    declarations: [
        WebHomeComponent,
    ],
    providers: []
})
export class WebModule { }
