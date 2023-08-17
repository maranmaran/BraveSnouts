import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BlogApi, BlogPost } from './blog.api';

@Component({
  selector: 'app-posts',
  styleUrls: ['./blog.styles.scss'],
  styles: [`
    :host { @apply p-6 sm:p-2 overflow-hidden flex flex-col  }
  `],
  template: `
    <div class="grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
        <ng-container *ngFor="let post of posts$ | async; let first = first">
          <ng-container *ngTemplateOutlet="postCard; context: { post, first }"></ng-container>  
        </ng-container>
    </div>

    <ng-template #postCard let-post="post" let-first="first">
      <mat-card  
        (click)="navigate(post)" 
        class="max-w-xl justify-self-center shadow-lg rounded-b-md flex justify-start 
               p-0 transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105"
        [ngClass]="{ 
          'min-w-full grid grid-cols-2 sm:grid-cols-1 gap-8 col-span-3 sm:col-span-1 lg:col-span-2': first 
        }"
      >
          <div mat-card-image 
            class="min-h-full sm:h-[200px] h-[250px] w-full self-center bg-no-repeat bg-cover" 
            [ngClass]="{ 'md:h-[250px] lg:h-[300px] xl:h-[350px] h-[450px]': first }"
            [ngStyle]="{
                  'background': 'url(' + post.hero.original.gUrl + '), url(' + post.hero.compressed.gUrl + '), url(' + post.hero.thumbnail.gUrl + ')',
            }"
          ></div>
          <mat-card-content>
            <mat-card-header class="px-4 pt-5 pb-0">
              <mat-card-title class="font-bold text-lg">{{post.title}}</mat-card-title>
              <mat-card-subtitle>{{post.date | date: 'MM d, HH:mm'}}</mat-card-subtitle>
            </mat-card-header>
            <div class="p-4 text-sm" [innerHTML]="post.description"></div>
            <app-social-links class="p-4" [instagram]="post.instagram" [facebook]="post.facebook"></app-social-links>
          </mat-card-content>
      </mat-card>
    </ng-template>
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
