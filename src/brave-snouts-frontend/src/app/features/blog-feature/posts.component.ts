import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BlogApi, BlogPost } from './blog.api';

@Component({
  selector: 'app-posts',
  styleUrls: ['./blog.styles.scss'],
  styles: [`
    :host { @apply flex flex-col }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
          <mat-card *ngFor="let post of posts$ | async" (click)="navigate(post)" class="
            max-w-xl justify-self-center
            shadow-lg rounded-b-md flex justify-start p-0 
            transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
          ">
            <div [ngStyle]="{
                background: 'url(' + post.hero + ') 50% 50% no-repeat',
                'background-size': 'cover',
                'align-self': 'center',
                'height': '250px',
                'width': '100%'
            }" mat-card-image ></div>
            <mat-card-header class="px-4 pt-5 pb-0">
              <mat-card-title class="font-bold text-lg">{{post.title}}</mat-card-title>
              <mat-card-subtitle>{{post.date | date: 'MM d, HH:mm'}}</mat-card-subtitle>
            </mat-card-header>
            <span class="p-4 text-sm" [innerHTML]="post.description"></span>
            <app-social-links class="p-4" [instagram]="post.instagram" [facebook]="post.facebook"></app-social-links>
        </mat-card>
      </div>
  `
})
export class PostsComponent {
  private readonly router = inject(Router);
  readonly posts$ = inject(BlogApi).getPosts();

  navigate(post: BlogPost) {
    const slug = post.slug;
    this.router.navigate(['blog', `clanak`, slug])
  }
}
