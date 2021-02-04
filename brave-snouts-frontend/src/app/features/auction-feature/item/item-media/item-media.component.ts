import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Gallery, ImageItem, VideoItem } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { from, noop, Observable } from 'rxjs';
import { mergeMap, take, map, toArray, tap, concatMap } from 'rxjs/operators';
import { FirebaseFile } from "src/business/models/firebase-file.model";
import { StorageService } from 'src/business/services/storage.service';

@Component({
  selector: 'app-item-media',
  templateUrl: './item-media.component.html',
  styleUrls: ['./item-media.component.scss'],
  providers: [StorageService]
})
export class ItemMediaComponent implements OnInit {

  constructor(
    private readonly gallery: Gallery,
    private readonly lightbox: Lightbox
  ) { }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() galleryId: string;
  @Input('first') onlyFirst: boolean = false;

  firstUrl$: Observable<string>;

  mobileImageUrl: string;

  ngOnInit(): void {

    // no items
    if(this.dbMedia?.length == 0)
      return;

    // show all
    if(!this.onlyFirst) {
      this.setupGallery();
    } else {
      this.mobileImageUrl = this.dbMedia[0].thumb ?? this.dbMedia[0].url
    }
  }

  /* Sets up images and videos for gallery component */
  setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);
    
    for (const { url, type, thumb } of this.dbMedia) {
      if(type == 'image') 
        galleryRef.addImage({ src: url, thumb: thumb ?? url, type });
  
      if(type == 'video')
        galleryRef.addVideo({ src: url, thumb: thumb ?? url, type });
    }
  }

  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number) {

    this.gallery.ref(this.galleryId).setConfig({imageSize: 'contain'});
    
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
    
    this.lightbox.closed.pipe(take(1)).subscribe(
      _ => this.gallery.ref(this.galleryId).setConfig({imageSize: 'cover'}),
      err => console.log(err)
    );
  }

}
