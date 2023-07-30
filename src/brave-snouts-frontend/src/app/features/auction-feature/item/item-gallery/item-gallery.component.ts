import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ItemsListDialogComponent } from 'src/app/features/auction-feature/item/items-list-dialog/items-list-dialog.component';
import {
  IPageInfo,
  VirtualScrollerComponent
} from 'src/app/shared/virtual-scroll/virtual-scroll';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemGalleryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() auction: Auction;
  @Input() items: AuctionItem[];
  @Input() parentScroll: Element;
  @Output() loadMore = new EventEmitter<IPageInfo>();

  private readonly _subsink = new SubSink();

  userId: string;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemDialogSvc: ItemDialogService,
    private readonly authSvc: AuthService,
    public readonly itemScrollViewSvc: ItemScrollViewService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.itemScrollViewSvc.initialize();

    this.isAuthenticated$ = this.authSvc.isAuthenticated$;

    this._subsink.add(
      this.authSvc.userId$.subscribe((id) => (this.userId = id)),
      this.itemDialogSvc.fetchMore.subscribe((event) =>
        this.loadMore.emit(event)
      )
    );

    this._subsink.add(
      this.itemScrollViewSvc.view$.subscribe((view) => {
        if (view == 'grid' && window.history.state == 'Items view') {
          // clear history state so we can go back
          console.debug('going back because of manual action');
          window.history.go(-1);
        }

        setTimeout(() => {
          this.itemsScroller?.refresh();
          this.gridScroller?.refresh()
        });

        this.changeDetectorRef.detectChanges();
      })
    );
  }

  ngOnChanges(changes) {
    this.itemDialogSvc.items.next(changes.items?.currentValue);
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
    this.itemScrollViewSvc.remove();
  }

  @Input('trackedItems') userTrackedItems: Set<string>;

  onLoadMore(event) {
    this.loadMore.emit(event);
  }

  trackByFn(_, item) {
    return item.id;
  }

  lastScrollItemIdx = 0;
  openItem(item: AuctionItem) {
    // override for scroll
    this.lastScrollItemIdx = this.items.findIndex((it) => it.id == item.id);
    this.openItemsScrollTabOnIndex(this.lastScrollItemIdx);

    // let dialogRef = this.dialog.open(SingleItemDialogComponent, {
    //   height: 'auto',
    //   width: '98%',
    //   maxWidth: '20rem',
    //   autoFocus: false,
    //   closeOnNavigation: true,
    //   panelClass: ['item-dialog', 'mat-elevation-z8'],
    //   data: { item, svc: this.itemDialogSvc },
    // });

    // dialogRef.afterClosed()
  }

  @ViewChild('itemsScroller', { static: false }) itemsScroller: VirtualScrollerComponent;
  @ViewChild('gridScroller', { static: false }) gridScroller: VirtualScrollerComponent;
  openItemsScrollTabOnIndex(idx: number) {
    this.itemScrollViewSvc.switchTab('items');

    window.history.pushState('Items view', 'Items view', window.location.href);

    setTimeout(() => {
      this.itemsScroller?.scrollToIndex(idx, true, 50, 0);
      this.gridScroller?.scrollToIndex(idx, true, 50, 0);
    });
  }

  // Handle back button navigation (history)
  @HostListener('window:popstate') onPopState() {
    console.debug('popping state');

    if (this.itemScrollViewSvc.block) {
      return;
    }

    if (this.itemScrollViewSvc.view == 'items') {
      this.itemScrollViewSvc.switchTab('grid');

      setTimeout(() => {
        this.itemsScroller?.scrollToIndex(this.lastScrollItemIdx, true, -50, 0);
        this.gridScroller?.scrollToIndex(this.lastScrollItemIdx, true, -50, 0);
      });
    }
  }

  openItemWithScroll(item: AuctionItem) {
    this.dialog.open(ItemsListDialogComponent, {
      height: '100%',
      width: '100vw',
      maxWidth: '100vw',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['items-dialog', 'mat-elevation-z8'],
      data: {
        auction: this.auction,
        items: this.items,
        initItem: item,
        initItemIdx: this.items.findIndex((it) => it.id == item.id),
        svc: this.itemDialogSvc,
      },
    });

    // dialogRef.afterClosed()
  }
}
