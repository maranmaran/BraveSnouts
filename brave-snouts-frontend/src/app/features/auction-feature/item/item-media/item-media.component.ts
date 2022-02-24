import { Component, Input, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { environment } from 'src/environments/environment';
import { GlobalSettingsService } from './../../../../../business/services/settings.service';

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
    private readonly settingsSvc: GlobalSettingsService,
    // private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    // this.manualChangeDetection = new ManualChangeDetection(changeDetectorRef);
  }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() galleryId: string;
  @Input('first') onlyFirst: boolean = false;

  firstUrl$: Observable<string>;

  mobileImageUrl: string;

  tempImageUrl = (imagePath: string) => imagePath.replace('auction-items', 'temp');

  async ngOnInit() {

    // no items
    if (!this.dbMedia || this.dbMedia.length == 0)
      return;

    // show all
    if (!this.onlyFirst) {
      await this.setupGallery();
    } else {
      this.mobileImageUrl = this.dbMedia[0].thumb + '&' + this.imageCacheSeed ?? this.dbMedia[0].url + '&' + this.imageCacheSeed
    }
  }

  /* Sets up images and videos for gallery component */
  async setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);

    const itemsLen = (await galleryRef.state.pipe(first()).toPromise()).items.length;

    if (!itemsLen && itemsLen == 0) {
      for (const { url, type, thumb } of this.dbMedia) {
        if (type == 'image')
          galleryRef.addImage({ src: this.tempImageUrl(url) + '&' + this.imageCacheSeed, thumb: thumb + '&' + this.imageCacheSeed ?? url + '&' + this.imageCacheSeed, type });

        if (type == 'video')
          galleryRef.addVideo({ src: this.tempImageUrl(url) + '&' + this.imageCacheSeed, thumb: thumb + '&' + this.imageCacheSeed ?? url + '&' + this.imageCacheSeed, type });
      }
    }

  }

  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number = 0) {

    // this.gallery.ref(this.galleryId).setConfig({imageSize: 'contain'});

    let lightboxData = [];
    for (const { url, type } of this.dbMedia) {
      if (type == 'image')
        lightboxData.push({ src: url + '&' + this.imageCacheSeed, thumb: url + '&' + this.imageCacheSeed, type });

      if (type == 'video')
        lightboxData.push({ src: url + '&' + this.imageCacheSeed, thumb: url + '&' + this.imageCacheSeed, type });
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
