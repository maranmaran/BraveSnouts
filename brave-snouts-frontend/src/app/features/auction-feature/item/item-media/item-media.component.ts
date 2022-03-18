import { Component, Input, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { environment } from 'src/environments/environment';
import { SettingsService } from './../../../../../business/services/settings.service';

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
  providers: [],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemMediaComponent implements OnInit {

  // private manualChangeDetection: ManualChangeDetection;
  protected imageCacheSeed = environment.imageCacheSeed;

  protected loadGradually$ = this.settingsSvc.settings$.pipe(map(x => x.gradualImageLoading));

  constructor(
    private readonly gallery: Gallery,
    private readonly lightbox: Lightbox,
    private readonly settingsSvc: SettingsService,
    protected readonly mediaObs: MediaObserver
    // private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    // this.manualChangeDetection = new ManualChangeDetection(changeDetectorRef);
  }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() auctionId: string;
  // TODO: Fix.. this needs to be in FirebaseFile under path like bucket/auctionId.. right now: bucket/fileName
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

  private getCachedImageUrl = (url: string) => url + '&' + this.imageCacheSeed;
  private getOriginalImageUrl = (media: FirebaseFile) => {
    //TODO: This needs to be fixed. url and thumbUrl have different guid behind auction-items
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
  async setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);

    const itemsLen = (await galleryRef.state.pipe(first()).toPromise()).items.length;

    if (!itemsLen && itemsLen == 0) {
      for (const { type, thumbUrl, compressedUrl, originalUrl } of this.media) {

        const galleryItem = { src: originalUrl ?? compressedUrl, thumb: thumbUrl ?? compressedUrl, type };

        if (type == 'image')
          galleryRef.addImage(galleryItem);

        if (type == 'video')
          galleryRef.addVideo(galleryItem);
      }
    }

  }

  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number = 0) {

    // this.gallery.ref(this.galleryId).setConfig({imageSize: 'contain'});

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

    // this.lightbox.closed.pipe(take(1)).subscribe(
    //   _ => this.gallery.ref(this.galleryId).setConfig({imageSize: 'cover'}),
    //   err => console.log(err)
    // );
  }

}
