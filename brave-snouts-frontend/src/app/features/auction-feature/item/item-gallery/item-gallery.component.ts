import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SingleItemComponent } from 'src/app/features/auction-feature/item/single-item/single-item.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';

@Component({
  selector: 'app-item-gallery',
  templateUrl: './item-gallery.component.html',
  styleUrls: ['./item-gallery.component.scss'],
  providers: [ItemDialogService]
})
export class ItemGalleryComponent implements OnInit, OnChanges {

  @Input() items: AuctionItem[];
  @Input() parentScroll: ElementRef;
  @Output() loadMore = new EventEmitter<any>();

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemDialogSvc: ItemDialogService
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes) {
    this.itemDialogSvc.items.next(changes.items.currentValue);
  }

  onLoadMore(event) {
    this.loadMore.emit(event);
  }

  trackByFn(_, item) {
    return item.id;
  }

  openItem(item: AuctionItem) {

    let dialogRef = this.dialog.open(SingleItemComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: { item, svc: this.itemDialogSvc }
    });

    // dialogRef.afterClosed()

  }

}
