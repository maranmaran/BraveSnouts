import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable } from 'rxjs';
import { ItemsListDialogComponent } from 'src/app/features/auction-feature/item/items-list-dialog/items-list-dialog.component';
import { SingleItemDialogComponent } from 'src/app/features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuthService } from 'src/business/services/auth.service';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-gallery',
  templateUrl: './item-gallery.component.html',
  styleUrls: ['./item-gallery.component.scss'],
  providers: [ItemDialogService]
})
export class ItemGalleryComponent implements OnInit, OnChanges, OnDestroy {

  @Input() items: AuctionItem[];
  @Input() parentScroll: ElementRef;
  @Output() loadMore = new EventEmitter<IPageInfo>();

  private readonly _subsink = new SubSink();

  userId: string;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemDialogSvc: ItemDialogService,
    private readonly authSvc: AuthService
  ) { }

  ngOnInit(): void {
    this.isAuthenticated$ = this.authSvc.isAuthenticated$;

    this._subsink.add(
      this.authSvc.userId$.subscribe(id => this.userId = id),
      this.itemDialogSvc.fetchMore.subscribe(
        event => this.loadMore.emit(event)
      )
    );
  }

  ngOnChanges(changes) {
    this.itemDialogSvc.items.next(changes.items.currentValue);
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  onLoadMore(event) {
    this.loadMore.emit(event);
  }

  trackByFn(_, item) {
    return item.id;
  }

  openItem(item: AuctionItem) {

    // override for scroll
    this.openItemWithScroll(item);
    return;

    let dialogRef = this.dialog.open(SingleItemDialogComponent, {
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

  openItemWithScroll(item: AuctionItem) {

    let dialogRef = this.dialog.open(ItemsListDialogComponent, {
      height: '100%',
      width: '100vw',
      maxWidth: '100vw',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['items-dialog', 'mat-elevation-z8'],
      data: { items: this.items, initItem: item, initItemIdx: this.items.findIndex(it => it.id == item.id), svc: this.itemDialogSvc }
    });

    // dialogRef.afterClosed()

  }

}
