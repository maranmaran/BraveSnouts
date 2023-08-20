import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { FirebaseFile } from 'src/business/models/firebase-file.model';

interface GalleryItem {
  type: 'image' | 'video';
  media: string[];
  cssBackground: string;
}

@Component({
  selector: 'media-gallery',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, GalleryModule, LightboxModule, NgOptimizedImage],
  template: `
        <img 
          *ngIf="galleryMedia?.length > 0"  
          class="w-full bg-no-repeat rounded-t-md"
          [ngStyle]="{
            'background-size': size,
            'background-image': galleryMedia[0].cssBackground,
            height: size == 'cover' ? '100%' : 'auto',
          }"
        />
  `
})
export class MediaGallery implements OnChanges {
  @Input() media: FirebaseFile[] = [];

  // settings
  @Input() maxResolution = false;
  @Input() size: 'cover' | 'contain' = 'cover';

  readonly galleryMedia: GalleryItem[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes.media) {
      this.media.map(x => {
        const loadingOrderMedia = [
          this.maxResolution ? x.original.gUrl : null,
          x.compressed.gUrl,
          x.thumbnail.gUrl,
        ].filter(x => !!x);

        const cssBackground = loadingOrderMedia.map(x => `url(${x})`).join(', ');

        this.galleryMedia.push({
          type: x.type,
          media: loadingOrderMedia,
          cssBackground
        });
      })
    }
  }
}
