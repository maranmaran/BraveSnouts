import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { IPageInfo } from 'ngx-virtual-scroller';
import { Observable, of } from 'rxjs';
import { concatMap, map, take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';
import { mergeArrays } from 'src/business/services/items.service';
import { MediaObserver } from '@angular/flex-layout';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss'],
  providers: [AuctionItemRepository]
})
export class ItemListComponent implements OnInit, OnDestroy {

  useGallery = true;

  constructor(
    private readonly authSvc: AuthService,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
    public readonly mediaObs: MediaObserver,
  ) { }

  @Input('auctionId') auctionId: string = "k83JqY20Bjnv58hmYcHb";
  @Input() parentScroll: ElementRef;

  private _subsink = new SubSink();
  
  async ngOnInit() {
    this.onLoadMore({endIndex: -1} as IPageInfo);
    this.getUserTrackedItems();
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  trackByFn(_, item) {
    return item.id;
  }

  userTrackedItems$: Observable<Set<string>>;

  /** Retrieves user relevant items */
  getUserTrackedItems() {
    this.userTrackedItems$ = this.authSvc.userId$
      .pipe(
        concatMap(userId => {

          if (!userId) return of(null);

          return this.authSvc.getUserItems(userId).pipe(take(1))
        }),
        map(items => {

          if (!items) return null;

          return new Set<string>(items.map(item => item.id))
        }),
      )
  }

  //#region  Pagination 

  items: AuctionItem[] = [];
  last: AuctionItem;

  fetchInProgress = false;
  noMoreData = false;

  /** Loads more data when page hits bottom */
  onLoadMore(event: IPageInfo) {

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
    this.loadingSvc.active$.next(true);

    const subscription = this.itemsRepo.getScrollPage(this.auctionId, this.last)
      .pipe(

      ).subscribe(items => {
        
          // disable next if no more items
          if (items.length < this.itemsRepo.pageSize) {
            this.noMoreData = true;
          }
          
          // join items
          this.items = mergeArrays(this.items, items);
          // console.log(`Currently having ${this.items.length} items.`, this.items)
          // console.log("Types are", items.map(item => item.type))
          // console.log("Caches are", items.map(item => item.payload.doc.metadata.fromCache))
          // console.log("\n")

          // set last item
          this.last = this.items[this.items.length - 1];

          // update flags
          this.fetchInProgress = false;
          this.loadingSvc.active$.next(false);

      }, err => console.log(err));

    this._subsink.add(subscription);
  }

  //#endregion


}
