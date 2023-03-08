import { Component, inject, Input, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { MediaObserver } from 'ngx-flexible-layout';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { SettingsService } from 'src/business/services/settings.service';
import { environment } from 'src/environments/environment';
import { ItemScrollViewService } from './../item-gallery/item-scroll-view.service';

interface ItemMedia {
  type: string;
  thumbUrl: string;
  compressedUrl: string;
  originalUrl: string;
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
    protected readonly mediaObs: MediaObserver,
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

  ngOnInit() {
    // no items
    if (!this.dbMedia || this.dbMedia.length == 0)
      return;

    this.media = this.getItemImages();

    this.setupGallery();
  }

  private getCachedImageUrl = (url: string) => url + '&cacheKey=' + this.imageCacheSeed;
  private getOriginalImageUrl = (media: FirebaseFile) => {
    //TODO: This needs to be fixed. 
    // 'url' and 'thumbUrl' have different guid behind 'auction-items'
    // This guid should actually be auctionId...

    const storageUrl = 'https://firebasestorage.googleapis.com';
    const projectId = environment.firebaseConfig.projectId + '.appspot.com';
    const itemPathEncoded = `temp%2F${this.auctionId}%2F${media.name}`; // 2%F = / when encodeURIcomponent()
    const fullTempUrl = `${storageUrl}/v0/b/${projectId}/o/${itemPathEncoded}?alt=media`;

    return media.tempUrl ?? fullTempUrl;
  };

  private getItemImages() {
    return this.dbMedia.map(x => ({
      type: x.type,
      thumbUrl: this.getCachedImageUrl(x.thumb),
      compressedUrl: this.getCachedImageUrl(x.url),
      originalUrl: this.getCachedImageUrl(this.getOriginalImageUrl(x))
    } as ItemMedia));
  }

  /* Sets up images and videos for gallery component */
  setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);

    const itemsLen = galleryRef.stateSnapshot.items.length;

    if (itemsLen > 0) {
      return;
    }

    for (const { type, thumbUrl, compressedUrl, originalUrl } of this.media) {

      const galleryItem = { src: originalUrl ?? compressedUrl, thumb: thumbUrl ?? compressedUrl, type };

      if (type == 'image')
        galleryRef.addImage(galleryItem);

      if (type == 'video')
        galleryRef.addVideo(galleryItem);
    }
  }


  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number = 0) {

    let lightboxData = [];
    for (const { type, thumbUrl, compressedUrl, originalUrl } of this.media) {

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
