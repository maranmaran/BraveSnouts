import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MediaGalleryModule } from "src/app/shared/media-gallery/media-gallery.component";
import { SocialLinksComponent } from "src/app/shared/social-links/social-links.component";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { AdoptHomeComponent } from "./adopt-home.component";
import { BlogRoutingModule } from "./adopt-routing.module";
import { AnimalComponent } from "./animal.component";
import { AnimalsComponent } from "./animals.component";

@NgModule({
    imports: [
        CommonModule,
        BlogRoutingModule,
        ToolbarComponent,
        SocialLinksComponent,

        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MediaGalleryModule
    ],
    declarations: [
        AdoptHomeComponent,
        AnimalComponent,
        AnimalsComponent,
    ],
    providers: []
})
export class AdoptModule { }
