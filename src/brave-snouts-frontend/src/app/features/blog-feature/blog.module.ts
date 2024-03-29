import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { SocialLinksComponent } from "src/app/shared/social-links/social-links.component";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { SafeHtmlPipe } from "src/business/pipes/safe-html.pipe";
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
        SocialLinksComponent,
    ],
    declarations: [
        BlogHomeComponent,
        PostComponent,
        PostsComponent,
        SafeHtmlPipe
    ],
    providers: []
})
export class BlogModule { }
