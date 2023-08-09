import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
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
      <div *ngIf="post()" class="h-full px-4 w-full max-w-7xl flex flex-col justify-center">
        <div class="font-bold sm:text-xl md:text-2xl lg:text-4xl text-6xl my-4 self-center ">{{post().title}}</div>
        <app-social-links class="post-socials" [instagram]="post().instagram" [facebook]="post().facebook"></app-social-links>

        <div class="w-full h-[400px] h-350px sm:h-[250px]" [ngStyle]="{
            background: 'url(' + post().hero + ') 50% 50% no-repeat',
            'background-size': 'cover',
            'align-self': 'center',
        }" mat-card-image ></div>
        
        <iframe src="undefined" title="Join Zabibas Global Giveaway" height="100%" width="100%" frameBorder="0" scrolling="no"></iframe>
        <div class="p-4 flex flex-col break-words prose" [innerHtml]="post().content | safeHtml"></div>
        <!-- <div class="p-4 flex flex-col break-words prose" [innerHtml]="post().contentJson"></div> -->
      </div>
  `
})
export class PostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentfulApi);

  post = signal<BlogPost>(null);;

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.initPostMutation();
    this.setPost();
  }

  setPost() {
    this.post.set(this.api.selectedPost);

    if (!this.post()) {
      const slug = this.route.snapshot.params.id;
      this.api.getPost(slug)
        .pipe(first())
        .subscribe({
          next: post => this.post.set(post),
          error: _ => this.router.navigate(['blog'])
        });
    }
  }

  initPostMutation() {
    this.post.mutate(post => {
      console.debug(post);
      if (!post) return;

      post.contentJson = post.contentJson ? documentToHtmlString(post.contentJson as any, {
        renderNode: {
          [`embedded-entry-block`]: (node, children) => this.renderEntry(node, children),
          ['embedded-asset-block']: (node, children) => this.renderAsset(node, children)
        }
      }) : post.contentJson
    })
  }

  renderEntry(node, _) {
    return `<iframe
          src= { node.data.target.fields.embedUrl }
          height = "100%"
          width = "100%"
          frameBorder = "0"
          scrolling = "no"
          title = { node.data.target.fields.title }
      />`
  }

  renderAsset(node, _) {
    return `
      <img style="height: auto; width: 55%; max-height: 350px; align-self: center">
          src="${'https://' + node.data.target.fields.file.url}"
          alt="${node.data.target.fields.description}"
      />
  `
  }

}
