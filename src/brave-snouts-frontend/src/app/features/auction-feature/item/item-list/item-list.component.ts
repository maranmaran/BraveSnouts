import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import {
  IPageInfo,
  VirtualScrollerComponent
} from 'src/app/shared/virtual-scroll/virtual-scroll';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { BreakpointService } from 'src/business/services/breakpoint.service';
import { mergeArrays } from 'src/business/services/items.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { ManualChangeDetection } from 'src/business/utils/manual-change-detection.util';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss'],
  providers: [AuctionItemRepository],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent implements OnInit, OnDestroy {
  private manualChangeDetection: ManualChangeDetection;

  @Input() useGallery = true;
  // overrides some functions like pagination since it's coming from different source
  // we will instead send event outside
  @Input() fromDialog = false;
  @Input('initItem') initItemFromDialog: AuctionItem;
  @Input('initItemIdx') initItemFromDialogIdx: number;
  @Input() userTrackedItems: Set<string>;

  // @Input() enableUnequalChildrenSizes = false;
  @Input() enableUnequalChildrenSizes = false;
  @Output() onFetchMore = new EventEmitter<IPageInfo>();

  @ViewChild('itemsScroller', { static: false })
  scroller: VirtualScrollerComponent;
  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.manualChangeDetection = new ManualChangeDetection(changeDetectorRef);
  }

  @Input() auction: Auction;
  @Input('auctionId') auctionId: string;
  @Input() parentScroll: Element;

  private _subsink = new SubSink();

  readonly isMobile$ = inject(BreakpointService).isMobile$;

  async ngOnInit() {
    if (this.fromDialog) {
      setTimeout(() => {
        this.scrollInto(this.initItemFromDialog, this.initItemFromDialogIdx);
      });
    }

    this.onLoadMore({ endIndex: -1 } as IPageInfo);
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  trackByFn(_, item) {
    return item.id;
  }

  //#region  Pagination

  @Input() items: AuctionItem[] = [];
  last: AuctionItem;

  fetchInProgress = false;
  noMoreData = false;

  /** Loads more data when page hits bottom */
  onLoadMore(event: IPageInfo) {
    if (this.fromDialog) {
      this.onFetchMore.emit(event);
      return;
    }

    // only if no other fetch is in progress
    if (this.fetchInProgress) {
      return;
    }

    // only if you have clearence to go to next page
    if (this.noMoreData) {
      return;
    }

    // only if you scrolled to bottom
    if (event.endIndex !== this.items.length - 1) {
      return;
    }

    this.fetchInProgress = true;
    this.loadingSvc.loading$.next(true);

    const subscription = this.itemsRepo
      .getScrollPage(this.auctionId, this.last)
      .subscribe(
        (items) => {
          // disable next if no more items
          if (items.length < this.itemsRepo.pageSize) {
            this.noMoreData = true;
          }

          // join items
          this.items = mergeArrays(this.items, items);

          // set last item
          this.last = this.items[this.items.length - 1];

          // update flags
          this.fetchInProgress = false;
          this.loadingSvc.loading$.next(false);
          // this.changeDetectorRef.detectChanges();
          this.manualChangeDetection.queueChangeDetection();
        }
      );

    this._subsink.add(subscription);
  }

  scrollInto(item: AuctionItem, idx: number) {
    this.scroller.scrollToIndex(idx, true, 50, 0);
  }

  //#endregion
}
