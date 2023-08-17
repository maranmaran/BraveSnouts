import { Component, OnInit, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { first } from 'rxjs'
import { BlogPost, BlogApi as ContentfulApi } from './blog.api'

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
        `,
  ],
  template: `
        <div *ngIf="post()" class="h-full px-4 w-full max-w-7xl flex flex-col justify-center">
            <div class="font-bold sm:text-xl md:text-2xl lg:text-4xl text-6xl my-4 self-center ">{{ post().title }}</div>
            <app-social-links
                class="post-socials"
                [instagram]="post().instagram"
                [facebook]="post().facebook"
            ></app-social-links>

            <div
                class="w-full h-[400px] h-350px sm:h-[250px] self-center bg-no-repeat bg-cover"
                [ngStyle]="{
                  'background': 'url(' + post().hero.original.gUrl + '), url(' + post().hero.compressed.gUrl + '), url(' + post().hero.thumbnail.gUrl + ')',
                }"
                mat-card-image
            ></div>

            <iframe
                src="undefined"
                title="Join Zabibas Global Giveaway"
                height="100%"
                width="100%"
                frameBorder="0"
                scrolling="no"
            ></iframe>
            <div class="p-4 flex flex-col break-words prose" [innerHtml]="post().content | safeHtml"></div>
        </div>
    `,
})
export class PostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly api = inject(ContentfulApi)

  post = signal<BlogPost>(null)

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    this.setPost()
  }

  setPost() {
    this.post.set(this.api.selectedPost)

    if (!this.post()) {
      const slug = this.route.snapshot.params.id
      this.api
        .getPost(slug)
        .pipe(first())
        .subscribe({
          next: post => this.post.set(post),
          error: _ => this.router.navigate(['blog']),
        })
    }
  }
}
