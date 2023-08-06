import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { BlogPost, BlogApi as ContentfulApi } from './blog.api';

@Component({
  selector: 'app-post',
  styleUrls: ['./blog.styles.scss'],
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `
  ],
  template: `
      <div *ngIf="!!post" class="h-full px-4 w-full max-w-7xl flex flex-col justify-center">
        <div class="font-bold sm:text-xl md:text-2xl lg:text-4xl text-6xl my-4 self-center ">{{post.title}}</div>
        <app-social-links class="post-socials" [instagram]="post.instagram" [facebook]="post.facebook"></app-social-links>

        <div class="w-full h-[400px] h-350px sm:h-[250px]" [ngStyle]="{
            background: 'url(' + post.hero + ') 50% 50% no-repeat',
            'background-size': 'cover',
            'align-self': 'center',
        }" mat-card-image ></div>
        <span class="p-4 flex flex-col break-words" [innerHTML]="post.content"></span>
      </div>
  `
})
export class PostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentfulApi);

  post: BlogPost;

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.post = this.api.selectedPost;

    if (!this.post) {
      const slug = this.route.snapshot.params.id;
      this.api.getPost(slug)
        .pipe(first())
        .subscribe({
          next: post => this.post = post,
          error: _ => this.router.navigate(['blog'])
        });
    }
  }

}
