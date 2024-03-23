import { Component } from '@angular/core';
import { ImageItem } from 'ng-gallery';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'web-container',
  templateUrl: 'web-home.component.html',
  styleUrls: ['web-home.component.scss'],
})
export class WebHomeComponent {

  carouselImages: ImageItem[] = [
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null }),
    new ImageItem({ src: `https://picsum.photos/seed/${uuidv4()}/1600/1600`, thumb: null })
  ]
}
