import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { IPageInfo } from 'ngx-virtual-scroller';
import { concat, of } from 'rxjs';
import { noop, Observable, Subscription } from 'rxjs';
import { concatMap, finalize, map, mergeMap, skip, switchMap, switchMapTo, take, tap, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { ItemsRdbRepository } from 'src/business/services/real-time-db/items.rdb.repository';
import { environment } from 'src/environments/environment';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit, OnDestroy {

  constructor(
    private readonly authSvc: AuthService,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
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
  first: AuctionItem;
  last: AuctionItem;

  initPageLoaded = false;
  fetchInProgress = false;
  nextDisabled = false;

  /** Loads more data when page hits bottom */
  onLoadMore(event: IPageInfo) {

    // only if no other fetch is in progress
    if (this.fetchInProgress) {
      return;
    }

    // only if you have clearence to go to next page
    if (this.nextDisabled) {
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
            this.nextDisabled = true;
          }
          
          // join items
          console.log("Fetched items")
          this.items = this.mergeArrays(this.items, items);
          console.log(`Currently having ${this.items.length} items.`, this.items)
          console.log("Types are", items.map(item => item.type))
          console.log("Caches are", items.map(item => item.payload.doc.metadata.fromCache))
          console.log("\n")

          // set last item
          this.last = this.items[this.items.length - 1];

          // update flags
          this.fetchInProgress = false;
          this.loadingSvc.active$.next(false);

      }, err => console.log(err));

    this._subsink.add(subscription);
  }

  /** Unionizes two auction item arrays to reflect new changes */
  mergeArrays(originalArr: AuctionItem[], nextArr: DocumentChangeAction<AuctionItem>[]) {

    let original = originalArr ? [...originalArr] : [];
    let next = nextArr ? [...nextArr] : [];

    // no new documents
    if (!next || next.length == 0)
      return original;

    // only new documents - init
    if (!original || original.length == 0)
      return next.map(item => item.payload.doc.data());


    // both collections exist - add new ones, update modified ones
    for (const document of next) {

      let idx = original.findIndex(item => item.id == document.payload.doc.id);

      // new document
      if (idx == -1) {
        original.push(document.payload.doc.data());
        console.log("Added");
      }
      // modified document
      else if (document.type == 'modified') {
        original[idx] = document.payload.doc.data();
        console.log('Modified');
      }

    }

    return original;

  }

  pagesProcessed = new Set<string>();
  addPage(id: string) {
    if (!id || this.pagesProcessed.has(id)) return;

    this.pagesProcessed.add(id);
  }

  //#endregion


}
