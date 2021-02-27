import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IPageInfo, VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { Observable, of } from 'rxjs';
import { concatMap, map, take } from 'rxjs/operators';
import { ItemsListDialogComponent } from 'src/app/features/auction-feature/item/items-list-dialog/items-list-dialog.component';
import { SingleItemDialogComponent } from 'src/app/features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuthService } from 'src/business/services/auth.service';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';
import { ItemScrollViewService } from './item-scroll-view.service';

@Component({
  selector: 'app-item-gallery',
  templateUrl: './item-gallery.component.html',
  styleUrls: ['./item-gallery.component.scss'],
  providers: [ItemDialogService, AuctionItemRepository],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private readonly itemsRepo: AuctionItemRepository,
    private readonly itemDialogSvc: ItemDialogService,
    private readonly authSvc: AuthService,
    public readonly itemScrollViewSvc: ItemScrollViewService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.itemScrollViewSvc.initialize();

    this.isAuthenticated$ = this.authSvc.isAuthenticated$;
    this.getUserTrackedItems();

    this._subsink.add(
      this.authSvc.userId$.subscribe(id => this.userId = id),
      this.itemDialogSvc.fetchMore.subscribe(
        event => this.loadMore.emit(event)
      )
    );

    this._subsink.add(
      this.itemScrollViewSvc.view$.subscribe(
        view => {
            this.changeDetectorRef.detectChanges()
            this.scroller.refresh()
        }
      )
    )
  }

  ngOnChanges(changes) {
    this.itemDialogSvc.items.next(changes.items.currentValue);
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
    this.itemScrollViewSvc.remove();
  }

  userTrackedItems: Set<string>;

  /** Retrieves user relevant items */
  getUserTrackedItems() {
    const userTrackedItems$ = this.authSvc.userId$
      .pipe(
        concatMap(userId => {

          if (!userId) return of(null);

          return this.itemsRepo.getUserItems(userId).pipe(take(1))
        }),
        map(items => {

          if (!items) return null;

          return new Set<string>(items.map(item => item.id))
        }),
      )

    this._subsink.add(
      userTrackedItems$.subscribe(items => this.userTrackedItems = items)
    )
  }

  onLoadMore(event) {
    this.loadMore.emit(event);
  }

  trackByFn(_, item) {
    return item.id;
  }

  openItem(item: AuctionItem) {

    // override for scroll
    this.openItemsScrollTabOnIndex(this.items.findIndex(it => it.id == item.id))
    // this.openItemWithScroll(item);
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

  @ViewChild('itemsScroller', { static: false }) scroller: VirtualScrollerComponent
  openItemsScrollTabOnIndex(idx: number) {

    this.itemScrollViewSvc.switchTab('items');

    this.scroller.scrollToIndex(idx, true, 50, 0);
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
