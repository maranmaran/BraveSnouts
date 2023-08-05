import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { BlogPost, ContentfulApiService as ContentfulApi } from './contentful.api';

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
      <div class="h-full px-2 sm:px-10 lg:px-28 max-w-7xl flex flex-col justify-center">
        <div class="font-bold text-2xl sm:text-4xl lg:text-6xl self-center py-8 sm:py-16 mt-4 px-0">{{post.title}}</div>
        <div [ngStyle]="{
            background: 'url(' + post.heroImage + ') 50% 50% no-repeat',
            'background-size': 'cover',
            'align-self': 'center',
            'height': '700px',
            'width': '100%'
        }" mat-card-image ></div>
        <span class="p-4" [innerHTML]="post.content"></span>
      </div>
  `
})
export class PostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentfulApi);

  post: BlogPost;

  ngOnInit() {
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
