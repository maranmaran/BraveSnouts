import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BlogPost, ContentfulApiService } from './contentful.api';

@Component({
  selector: 'app-posts',
  styleUrls: ['./blog.styles.scss'],
  template: `
  <div class="flex justify-center items-center">
    <div class="mat-headline-4 p-4">toolbar </div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-2 min-[1600px]:grid-cols-3 min-[2300px]:grid-cols-4">
        <mat-card *ngFor="let post of posts$ | async" (click)="navigate(post)" class="
          max-w-xl justify-self-center
          shadow-lg my-12 mx-3 sm:m-10 rounded-b-md flex justify-start p-0 
          transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
        ">
          <div [ngStyle]="{
              background: 'url(' + post.heroImage + ') 50% 50% no-repeat',
              'background-size': 'cover',
              'align-self': 'center',
              'height': '450px',
              'width': '100%'
          }" mat-card-image ></div>
          <mat-card-header class="px-7 pt-5 pb-0">
            <mat-card-title class="mat-headline-5">{{post.title}}</mat-card-title>
            <mat-card-subtitle class="relative bottom-4">{{post.date | date: 'MM d, HH:mm'}}</mat-card-subtitle>
          </mat-card-header>
          <span class="p-4" [innerHTML]="post.description"></span>
      </mat-card>
    </div>
  `
})
export class PostsComponent {
  private readonly router = inject(Router);
  readonly posts$ = inject(ContentfulApiService).getPosts();

  navigate(post: BlogPost) {
    const slug = post.slug;
    this.router.navigate(['blog', `clanak`, slug])
  }
}
