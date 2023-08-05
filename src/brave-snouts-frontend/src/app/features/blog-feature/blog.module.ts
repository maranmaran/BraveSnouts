import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
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
    ],
    declarations: [
        BlogHomeComponent,
        PostComponent,
        PostsComponent,
    ],
    providers: []
})
export class BlogModule { }
