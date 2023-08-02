import { Component, inject, Input, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { firstValueFrom } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { FirebaseImagePipe } from 'src/business/pipes/firebase-image.pipe';
import { BreakpointService } from 'src/business/services/breakpoint.service';
import { SettingsService } from 'src/business/services/settings.service';
import { environment } from 'src/environments/environment';
import { ItemScrollViewService } from './../item-gallery/item-scroll-view.service';

export interface ItemMedia {
  type: 'image' | 'video'
  urlThumb: string;
  urlComp: string;
  urlOrig: string;
}

@Component({
  selector: 'app-item-media',
  templateUrl: './item-media.component.html',
  styleUrls: ['./item-media.component.scss'],
  providers: []
})
export class ItemMediaComponent implements OnInit {
  protected imageCacheSeed = environment.imageCacheSeed;

  protected loadGradually$ = inject(SettingsService).settings$.pipe(
    map(x => x.gradualImageLoading)
  );

  constructor(
    private readonly gallery: Gallery,
    private readonly lightbox: Lightbox,
    private readonly itemScrollSvc: ItemScrollViewService,
    private readonly firebaseImagePipe: FirebaseImagePipe,
  ) {
  }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() auctionId: string;
  @Input() galleryId: string;
  @Input('first') mobileView: boolean = false;

  media: ItemMedia[];

  readonly isMobile$ = inject(BreakpointService).isMobile$;

  async ngOnInit() {
    // no items
    if (!this.dbMedia || this.dbMedia.length == 0)
      return;

    this.media = this.getItemImages();

    await this.setupGallery();
  }

  private getCachedImageUrl = (url: string) => url + '?cacheKey=' + this.imageCacheSeed;

  private getItemImages() {
    return this.dbMedia.map(x => ({
      type: x.type,
      urlOrig: this.getCachedImageUrl(x.original.gUrl),
      urlComp: this.getCachedImageUrl(x.compressed.gUrl),
      urlThumb: this.getCachedImageUrl(x.thumbnail.gUrl),
    } as ItemMedia));
  }

  /* Sets up images and videos for gallery component */
  async setupGallery() {
    const galleryRef = this.gallery.ref(this.galleryId);

    const itemsLen = galleryRef.stateSnapshot.items.length;
    if (itemsLen > 0) {
      return;
    }

    const loadGradually = await firstValueFrom(this.loadGradually$);

    for (const mediaItem of this.media) {
      const galleryItem = {
        ...(await firstValueFrom(this.firebaseImagePipe.transform(mediaItem))),
        type: mediaItem.type
      };

      if (galleryItem.type == 'image')
        galleryRef.addImage(galleryItem);

      if (galleryItem.type == 'video')
        galleryRef.addVideo(galleryItem);
    }

    galleryRef.set(0, 'instant');
  }


  /* Opens fullscreen view of image aka lightbox */
  async openLightbox(imageIdx: number = 0) {
    let lightboxData = [];

    for (const mediaItem of this.media) {
      const lightboxItem = {
        ...(await firstValueFrom(this.firebaseImagePipe.transform(mediaItem, true))),
        type: mediaItem.type
      };

      if (lightboxItem.type == 'image')
        lightboxData.push(lightboxItem);

      if (lightboxItem.type == 'video')
        lightboxData.push(lightboxItem);
    }

    this.lightbox.open(imageIdx, this.galleryId, {
      'panelClass': 'fullscreen',
    });

    this.itemScrollSvc.block = true;
    history.pushState({ modal: true }, '');

    this.lightbox.closed
      .pipe(first())
      .subscribe(() => setTimeout(() => this.itemScrollSvc.block = false));
  }

}
