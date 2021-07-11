import { Component, Input, OnInit } from '@angular/core';
import { Gallery } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { environment } from 'src/environments/environment';

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

  constructor(
    private readonly gallery: Gallery,
    private readonly lightbox: Lightbox,
    // private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    // this.manualChangeDetection = new ManualChangeDetection(changeDetectorRef);
  }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() galleryId: string;
  @Input('first') onlyFirst: boolean = false;

  firstUrl$: Observable<string>;

  mobileImageUrl: string;

  async ngOnInit() {

    // no items
    if(!this.dbMedia || this.dbMedia.length == 0)
      return;

    // show all
    if(!this.onlyFirst) {
      await this.setupGallery();
    } else {
      this.mobileImageUrl = this.dbMedia[0].thumb ?? this.dbMedia[0].url
    }
  }

  /* Sets up images and videos for gallery component */
  async setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);

    const itemsLen = (await galleryRef.state.pipe(first()).toPromise()).items.length;

    if(!itemsLen && itemsLen == 0) {
      for (const { url, type, thumb } of this.dbMedia) {
        if(type == 'image')
          galleryRef.addImage({ src: url, thumb: thumb ?? url, type });
  
        if(type == 'video')
          galleryRef.addVideo({ src: url, thumb: thumb ?? url, type });
      }
    }

  }

  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number = 0) {

    // this.gallery.ref(this.galleryId).setConfig({imageSize: 'contain'});

    let lightboxData = [];
    for (const { url, type } of this.dbMedia) {
      if(type == 'image')
        lightboxData.push({ src: url, thumb: url, type });

      if(type == 'video')
        lightboxData.push({ src: url, thumb: url, type });
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
