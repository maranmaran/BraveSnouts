import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { firstValueFrom, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { FirebaseImagePipe } from 'src/business/pipes/firebase-image.pipe';
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
export class ItemMediaComponent implements OnInit, OnDestroy {
  private readonly ngUnsubscribeSubject = new Subject<void>();

  private readonly gallery = inject(Gallery);
  private readonly lightbox = inject(Lightbox);
  private readonly firebaseImagePipe = inject(FirebaseImagePipe);
  private readonly itemScrollSvc = inject(ItemScrollViewService);

  @Input() auctionId = '';
  @Input() galleryId = '';
  @Input('first') mobileView = false;
  @Input('media') dbMedia: FirebaseFile[] = [];

  media: ItemMedia[];

  readonly imageCacheSeed = environment.imageCacheSeed;
  readonly loadGradually$ = inject(SettingsService).settings$.pipe(
    map(x => x.gradualImageLoading)
  );

  private get ref() { return this.gallery.ref(this.galleryId); }

  async ngOnInit() {
    if (!this.dbMedia || this.dbMedia.length == 0)
      return;

    this.setMedia();
    await this.setupGallery();
  }

  ngOnDestroy() {
    this.ref.destroy();
    this.ngUnsubscribeSubject.next();
  }

  private getCachedImageUrl(url: string) {
    return url + '?cacheKey=' + this.imageCacheSeed;
  }

  private setMedia() {
    this.media = this.dbMedia.map(x => ({
      type: x.type,
      urlOrig: this.getCachedImageUrl(x.original.gUrl),
      urlComp: this.getCachedImageUrl(x.compressed.gUrl),
      urlThumb: this.getCachedImageUrl(x.thumbnail.gUrl),
    } as ItemMedia));
  }

  private async setupGallery() {
    await this.addItemsToGallery();

    this.ref.set(0, 'instant');
  }

  /* Opens fullscreen view of image aka lightbox */
  async openLightbox(mediaIdx: number = 0) {
    const forceHighQuality = !this.mobileView;

    await this.addItemsToGallery(forceHighQuality);

    this.lightbox.open(mediaIdx, this.galleryId, { 'panelClass': 'fullscreen' });

    this.itemScrollSvc.block = true;
    history.pushState({ modal: true }, '');

    this.lightbox.closed
      .pipe(first())
      .subscribe(() => {
        this.setupGallery();
        setTimeout(() => this.itemScrollSvc.block = false)
      });
  }

  private async addItemsToGallery(forceHighQuality = false) {
    this.ref.reset();
    for (const mediaItem of this.media) {
      const item = {
        ...(await firstValueFrom(
          this.firebaseImagePipe.transform(mediaItem, forceHighQuality))
        ),
        type: mediaItem.type,
      };

      if (item.type == 'image')
        this.ref.addImage(item);

      if (item.type == 'video')
        this.ref.addVideo(item);
    }
  }
}

