import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { IPageInfo } from 'ngx-virtual-scroller';
import { of } from 'rxjs';
import { noop, Observable, Subscription } from 'rxjs';
import { concatMap, finalize, map, mergeMap, skip, take, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { environment } from 'src/environments/environment';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit, OnDestroy {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
    private readonly mediaObs: MediaObserver,
    private readonly authSvc: AuthService,
  ) { }

  // Input data and user info
  @Input('auctionId') auctionId: string = "k83JqY20Bjnv58hmYcHb";
  @Input() parentScroll: ElementRef;

  private _subsink = new SubSink();

  ngOnInit(): void {
    this.initialPage();
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

          return this.itemsRepo.getUserItems(userId).pipe(take(1))
        }),
        map(items => {

          if (!items) return null;

          return new Set<string>(items.map(item => item.id))
        }),
      )
  }

  //#region  Pagination 
  
  items: AuctionItem[];
  first: AuctionItem;
  last: AuctionItem;

  initPageLoaded = false;
  fetchInProgress = false;
  nextDisabled = false;

  /** Gets initial page */
  initialPage() {
    
    this.loadingSvc.active$.next(true);
    this.itemsRepo.getInitialPage(this.auctionId)
    .pipe(
      take(1),
      // tap(console.log),
      tap(items => {

        // join items
        this.items = [...items];

        // set first item reference
        // (this.first = this.items[0], this.firstEver = this.items[0]);
        this.first = this.items[0];

        // Process page
        if(this.pagesProcessed.has(this.first.id)) return;
        this.addPage(this.first.id); 

        // set last reference
        this.last = this.items[this.items.length - 1];
        
      }),
      finalize(() => (this.initPageLoaded = true, this.loadingSvc.active$.next(false)))
    ).subscribe(items => this.subscribeToItemChanges(items), err => console.log(err));
    
  }

  /** Loads more data when page hits bottom */
  onLoadMore(event: IPageInfo) {
    
    // only if initial page loaded 
    if(!this.initPageLoaded) {
      return;
    }

    if(this.fetchInProgress) {
      return;
    }

    // only if you scrolled to bottom
    if (event.endIndex !== this.items.length - 1) {
      return;
    }
    // only if you have clearence to go to next page
    if(this.nextDisabled) {
      return;
    }
    // no data already
    if (!this.items || this.items.length == 0) {
      return;
    }
    // no last item to paginate for next page
    if (!this.last) {
      return;
    }
    // only if this page wasn't processed already
    if(this.pagesProcessed.has(this.last.id)) {
      return;
    }

    this.fetchInProgress = true;

    this.loadingSvc.active$.next(true);
    this.itemsRepo.getNextPage(this.last)
    .pipe(
      take(1),
      // tap(console.log),
      tap(items => {

        // disable next if no more items
        if(items.length < this.itemsRepo.pageSize) {
          this.nextDisabled = true;
        }

        // process page
        if(this.pagesProcessed.has(this.last.id)) return;
        this.addPage(this.last.id); 

        // join items
        this.items = [...this.items, ...items];

        // set last item
        this.last = items[items.length - 1];

      }),
      finalize(() => ( this.fetchInProgress = false, this.loadingSvc.active$.next(false) ))
    ).subscribe(items => this.subscribeToItemChanges(items), err => console.log(err));
  }
  
  /** Subscribe to all new items for their changes */
  subscribeToItemChanges(items: AuctionItem[]) {
    for(const item of items) {

      /** Subscribes to single item for changes and handle */
      this._subsink.add(

        this.itemsRepo.getOne(this.auctionId, item.id)
        .pipe(
          // tap(console.log),
          skip(1),
          tap(item => this.handleItemUpdate(item))
        ).subscribe(noop, err => console.log(err))

      )

    }
  }

  /** Updates item in array */
  handleItemUpdate(item: AuctionItem) {
    let itemIdx = this.items.findIndex(i => i.id == item.id);
    this.items[itemIdx] = item;
  }

  pagesProcessed = new Set<string>();
  addPage(id: string) {
    if(!id || this.pagesProcessed.has(id)) return;

    this.pagesProcessed.add(id);
  }

  //#endregion
  

}
