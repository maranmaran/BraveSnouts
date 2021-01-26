import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { CountdownConfig } from 'ngx-countdown';
import { IPageInfo } from 'ngx-virtual-scroller';
import { noop, Observable } from 'rxjs';
import { finalize, map, skip, take, tap } from 'rxjs/operators';
import { PostDetailsComponent } from 'src/app/features/auction-feature/delivery/post-details/post-details.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { Winner } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { BidsRepository } from 'src/business/services/bids.repository';
import { FunctionsService } from 'src/business/services/functions.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { WinnersRepository } from 'src/business/services/winners.repository';
import { formatDateToHoursOnlyNgxCountdown } from 'src/business/utils/date.utils';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit {

  
  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly bidRepo: BidsRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly route: ActivatedRoute,
    public readonly mediaObs: MediaObserver,
    private readonly functionsSvc: FunctionsService,
    private readonly dialog: MatDialog,
    private readonly loadingSvc: ProgressBarService,
  ) { }

  private _auctionId: string;

  auction$: Observable<Auction>;
  items$: Observable<AuctionItem[]>;
  winners: Map<string, Winner>;

  activeItemId: string;

  users = new Map<string, any>();
  bids$: Observable<Bid[]>;

  state: 'future' | 'active' | 'expired';
  config: CountdownConfig

  private _subsink = new SubSink();
  
  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('id');
    this.state = this.route.snapshot.paramMap.get('state') as 'future' | 'active' | 'expired';

    this.auction$ = this.auctionRepo.getOne(this._auctionId);
    
    this.initialPage();


    this.setupCountdown();
  }

  items: AuctionItem[];
  first: AuctionItem;
  last: AuctionItem;

  initPageLoaded = false;
  fetchInProgress = false;
  nextDisabled = false;

  /** Gets initial page */
  initialPage() {
    
    this.loadingSvc.active$.next(true);
    this.itemsRepo.getInitialPage(this._auctionId)
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

        this.itemsRepo.getOne(this._auctionId, item.id)
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

  trackByFn(_, item) {
    return item.id;
  }

  getBids(itemId: string) {
    this.activeItemId = itemId;
    
    const query = ref => ref.where('itemId', '==', itemId).orderBy("date", "desc").limit(5);
    this.bids$ = this.bidRepo.getAll(query);
  }

  /**Sets up countdown component to coundown to the end date time*/
  setupCountdown() {
    this._subsink.add(this.auction$.subscribe(auction => {
      
      const today = moment(new Date(), "DD/MM/YYYY HH:mm:ss");
      const auctionEnd = moment(auction.endDate.toDate(), "DD/MM/YYYY HH:mm:ss"); 
      const dateDiff = auctionEnd.diff(today);
      const duration = moment.duration(dateDiff);
      const leftTime = duration.asSeconds();

      this.config = { leftTime, format: "HHh mmm sss", formatDate: formatDateToHoursOnlyNgxCountdown }
    }, err => console.log(err)));
  }

  closeAuction(auctionId) {
    this.functionsSvc.endAuction(auctionId)
    // TODO
    .subscribe(res => console.log(res), err => console.log(err));
  }

  openPostalInformation(data) {
    
    const dialogRef = this.dialog.open(PostDetailsComponent, {
      height: 'auto',
      width: 'auto',
      maxWidth: '98%',
      autoFocus: false,
      closeOnNavigation: true,
      data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(noop, err => console.log(err))

  }

}
