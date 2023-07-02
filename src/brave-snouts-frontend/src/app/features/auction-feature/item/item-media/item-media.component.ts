import { Component, inject, Input, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { firstValueFrom } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { SettingsService } from 'src/business/services/settings.service';
import { environment } from 'src/environments/environment';
import { ItemScrollViewService } from './../item-gallery/item-scroll-view.service';

interface ItemMedia {
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
    private readonly itemScrollSvc: ItemScrollViewService
  ) {
  }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() auctionId: string;
  @Input() galleryId: string;
  @Input('first') mobileView: boolean = false;

  media: ItemMedia[];

  public get isMobile(): boolean {
    return this.mobileView;
  }

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
      urlOrig: this.getCachedImageUrl(x.urlOrig),
      urlComp: this.getCachedImageUrl(x.urlComp),
      urlThumb: this.getCachedImageUrl(x.urlThumb),
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

    for (const { type, urlThumb: thumbUrl, urlComp: compressedUrl, urlOrig: originalUrl } of this.media) {

      const galleryItem = {
        src: loadGradually ? originalUrl : compressedUrl ?? originalUrl,
        thumb: loadGradually ? originalUrl : thumbUrl ?? originalUrl,
        type
      };

      if (type == 'image')
        galleryRef.addImage(galleryItem);

      if (type == 'video')
        galleryRef.addVideo(galleryItem);
    }
  }


  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number = 0) {

    let lightboxData = [];
    for (const { type, urlThumb: thumbUrl, urlComp: compressedUrl, urlOrig: originalUrl } of this.media) {

      const galleryItem = { src: originalUrl ?? compressedUrl, thumb: thumbUrl ?? compressedUrl, type };

      if (type == 'image')
        lightboxData.push(galleryItem);

      if (type == 'video')
        lightboxData.push(galleryItem);
    }

    this.lightbox.open(imageIdx, this.galleryId, {
      'panelClass': 'fullscreen',
    });

    history.pushState({ modal: true }, '');

    this.itemScrollSvc.block = true;

    this.lightbox.closed
      .pipe(first())
      .subscribe(() => setTimeout(() => this.itemScrollSvc.block = false));
  }

}
