import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { GalleryModule } from "ng-gallery";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { TruncatePipe } from "src/business/pipes/truncate.pipe";
import { BlogHomeComponent } from "./blog-home.component";
import { BlogRoutingModule } from "./blog-routing.module";
import { PostComponent } from "./post.component";
import { PostsComponent } from "./posts.component";

@NgModule({
    imports: [
        CommonModule,
        BlogRoutingModule,
        ToolbarComponent,

        MatCardModule,
        MatButtonModule,
        MatIconModule,

        GalleryModule,
        TruncatePipe
    ],
    declarations: [
        BlogHomeComponent,

        PostComponent,
        PostsComponent,
    ],
    providers: []
})
export class BlogModule { }
