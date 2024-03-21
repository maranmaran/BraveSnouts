import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { FirebaseFile } from 'src/business/models/firebase-file.model';

interface GalleryItem {
  type: 'image' | 'video';
  cssBackground: string;
  src: string;
}

@Component({
  selector: 'media-gallery',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, GalleryModule, LightboxModule, NgOptimizedImage],
  template: `
        <img 
          *ngIf="galleryMedia?.length > 0"  
          [attr.src]="galleryMedia[0].src"
          class="w-full bg-no-repeat rounded-t-md"
          [ngStyle]="{
            'background-size': size,
            'background-image': galleryMedia[0].cssBackground,
            'height': size == 'cover' ? '100%' : 'auto'
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
        this.galleryMedia.push({
          type: x.type,
          ...this.getSources(x, this.size, this.maxResolution)
        });
      })
    }
  }

  private getSources(media: FirebaseFile, size: 'cover' | 'contain', maxResolution: boolean = false) {
    // for cover we go full css background + height 100%
    // for contain we go src + background + height auto
    const highestToLowestRes = [
      maxResolution ? media.original.gUrl : null,
      media.compressed.gUrl,
      media.thumbnail.gUrl,
    ].filter(x => !!x);

    return {
      src: size == 'cover' ? null : highestToLowestRes[0],
      cssBackground: highestToLowestRes.slice(
        size == 'cover' ? 0 : 1
      ).map(x => `url(${x})`).join(', '),
    }
  }
}
