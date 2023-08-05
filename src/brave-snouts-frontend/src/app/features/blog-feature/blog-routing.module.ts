import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogHomeComponent } from './blog-home.component';
import { PostComponent } from './post.component';
import { PostsComponent } from './posts.component';

const routes: Routes = [
    {
        path: '', component: BlogHomeComponent, children: [
            { path: '', component: PostsComponent },
            { path: 'clanak/:id', data: {}, component: PostComponent },
        ]
    },
    { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BlogRoutingModule { }
