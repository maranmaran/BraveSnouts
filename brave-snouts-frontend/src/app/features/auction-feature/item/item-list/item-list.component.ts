import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { IPageInfo } from 'ngx-virtual-scroller';
import { noop, Observable } from 'rxjs';
import { concatMap, map, take, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
    private readonly mediaObs: MediaObserver,
    private readonly authSvc: AuthService,
  ) { }

  // Input data and user info
  @Input('auctionId') auctionId: string = "k83JqY20Bjnv58hmYcHb";
  @Input() parentScroll: ElementRef;

  useScroll = true;

  userTrackedItems$: Observable<Set<string>>;

  items: AuctionItem[];
  first: AuctionItem;
  last: AuctionItem;
  
  nextDisabled = false;

  firstEver: AuctionItem;
  get previousDisabled(): boolean {
    return this.first ? this.firstEver?.name == this.first.name : false;
  };

  private _subsink = new SubSink();
  
  ngOnInit(): void {

    this.loadingSvc.active$.next(true);
    this.itemsRepo.getInitialPage(this.auctionId)
    .pipe(
      take(1), 
      tap(items => this.items = items),
      tap(items => (this.first = items[0], this.firstEver = items[0])),
      tap(items => this.last = items[items.length - 1]),
      tap(() => this.loadingSvc.active$.next(false)),
    ).subscribe(noop);

    this.getUserTrackedItems();

  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }
  
  trackByFn(_, item) {
    return item.id;
  }

  /** Retrieves user relevant items */
  getUserTrackedItems() {
    this.userTrackedItems$ =  this.authSvc.userId$.pipe(
      take(1),
      concatMap(userId => this.itemsRepo.getUserItems(userId)),
      map(items => new Set<string>(items.map(item => item.id))),
    )
  }

  /** Loads more data when page hits bottom */
  previous: AuctionItem;
  onLoadMore(event: IPageInfo) {

    if(!this.items || this.items.length == 0)
      return;
    
    if(!this.last) 
      return;
    
    if(event.endIndex !== this.items.length - 1)
      return;

    if(this.previous?.id == this.last?.id)
      return;
      
    this.previous = this.last;

    this.loadingSvc.active$.next(true);
    this.itemsRepo.getNextPage(this.last)
    .pipe(
      take(1),
      // append
      map(items => [...this.items, ...items]),
      
      // map necessary data
      tap(items => this.items = items),
      tap(items => this.first = items[0]),
      tap(items => this.last = items[items.length - 1]),
      tap(() => this.loadingSvc.active$.next(false)))
    .subscribe(noop);
  }

  /** Goes to next page*/
  nextPage() {

    if(!this.items || this.items.length == 0)
      return;
    
    if(!this.last)
      return; 

    if(this.nextDisabled)
      return;

    this.loadingSvc.active$.next(true);
    this.itemsRepo.getNextPage(this.last)
    .pipe(
      take(1),
      // disable next button if no more items
      tap(items => items?.length < this.itemsRepo.pageSize ? this.nextDisabled = true : noop),
      // map necessary data
      tap(items => this.items = items),
      tap(items => this.first = items[0]),
      tap(items => this.last = items[items.length - 1]),
      tap(() => this.loadingSvc.active$.next(false)))
    .subscribe(noop, err => console.log(err));
  }

  /** Goes to previous page */
  previousPage() {

    if(!this.items || this.items.length == 0)
      return;
    
    if(!this.first)
      return; 

    if(this.previousDisabled)
      return;

    this.loadingSvc.active$.next(true);
    this.itemsRepo.getPreviousPage(this.first)
    .pipe(
      take(1),
      // map necessary data
      tap(items => this.items = items),
      tap(items => this.first = items[0]),
      tap(items => this.last = items[items.length - 1]),
      tap(() => this.nextDisabled = false),
      tap(() => this.loadingSvc.active$.next(false)))
    .subscribe(noop);
  }

}
