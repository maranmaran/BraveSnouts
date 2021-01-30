import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuctionItem } from 'src/business/models/auction-item.model';

@Component({
  selector: 'app-item-gallery',
  templateUrl: './item-gallery.component.html',
  styleUrls: ['./item-gallery.component.scss']
})
export class ItemGalleryComponent implements OnInit {

  @Input() items: AuctionItem[];
  @Input() parentScroll: ElementRef;
  @Output() loadMore = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  onLoadMore(event) {
    this.loadMore.emit(event);
  }

  trackByFn(_, item) {
    return item.id;
  }

  openItem(item: AuctionItem) {

  }

}
