import { Component, Input, OnInit } from '@angular/core';
import { Gallery, ImageItem, VideoItem } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';
import { from, noop } from 'rxjs';
import { mergeMap, take, map, toArray, tap, concatMap } from 'rxjs/operators';
import { FirebaseFile } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { StorageService } from 'src/business/services/storage.service';

@Component({
  selector: 'app-item-media',
  templateUrl: './item-media.component.html',
  styleUrls: ['./item-media.component.scss']
})
export class ItemMediaComponent implements OnInit {

  constructor(
    private readonly storage: StorageService,
    private readonly gallery: Gallery,
    private readonly lightbox: Lightbox
  ) { }

  @Input('media') dbMedia: FirebaseFile[];
  @Input() galleryId: string;

  media: { src: string, thumb: string, type: 'image' | 'video' }[] = [];

  ngOnInit(): void {
    this.getUrls();
  }

  /* Gets download URLS for 1 ITEM and stores them in MAP */
  getUrls() {
    from(this.dbMedia)
    .pipe(
      map((media, index) => Object.assign(media, { index })),
      mergeMap(media => this.storage.getDownloadUrl(media.path).pipe(take(1), map(path => [path, media.type, media.index]))),
      map(([src, type, index]) => ({ src, thumb: src, type, index })),
      toArray(),
      map(mediaArr => this.media = mediaArr.sort((a, b) => a.index > b.index ? 1 : -1)),
      tap(_ => this.setupGallery()),
      take(1),
    ).subscribe(noop, err => console.log(err))
  }

  /* Sets up images and videos for gallery component */
  setupGallery() {

    const galleryRef = this.gallery.ref(this.galleryId);
    
    for (const { src, thumb, type } of this.media) {
      if(type == 'image') 
        galleryRef.addImage({ src, thumb, type });
  
      if(type == 'video')
        galleryRef.addVideo({ src, thumb, type });
    }
  }

  /* Opens fullscreen view of image aka lightbox */
  openLightbox(imageIdx: number) {

    this.gallery.ref(this.galleryId).setConfig({imageSize: 'contain'});
    
    let lightboxData = [];
    for (const { src, thumb, type } of this.media) {
      if(type == 'image') 
        lightboxData.push(new ImageItem({ src, thumb, type }));
  
      if(type == 'video')
        lightboxData.push(new VideoItem({ src, thumb, type }));
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
