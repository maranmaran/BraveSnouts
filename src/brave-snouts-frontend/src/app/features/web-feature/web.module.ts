import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { GalleryModule } from "ng-gallery";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { WebHomeComponent } from "./web-home.component";
import { WebRoutingModule } from "./web-routing.module";

@NgModule({
    imports: [
        CommonModule,
        WebRoutingModule,
        ToolbarComponent,

        GalleryModule
    ],
    declarations: [
        WebHomeComponent,
    ],
    providers: []
})
export class WebModule { }
