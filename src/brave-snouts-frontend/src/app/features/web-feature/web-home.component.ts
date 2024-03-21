import { Component } from '@angular/core';
import { GALLERY_CONFIG, ImageItem } from 'ng-gallery';
import { v4 as uuidv4 } from 'uuid';

const CAROUSEL_GALLERY_CONFIG = {
  autoPlay: true,
  imageSize: 'cover',
  dots: true,
  dotsPosition: 'bottom',

  scrollBehavior: 'smooth',
  loadingStrategy: 'preload',

  counter: false,
  thumb: false,
  loop: true,

  debug: false,
}

@Component({
  selector: 'web-container',
  templateUrl: 'web-home.component.html',
  styleUrls: ['web-home.component.scss'],
  providers: [
    { provide: GALLERY_CONFIG, useValue: CAROUSEL_GALLERY_CONFIG },
  ]
})
export class WebHomeComponent {

  carouselImages: ImageItem[] = [
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null })
  ]
}
