import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import * as moment from 'moment';
import { CountdownConfig } from 'ngx-countdown';
import { IPageInfo } from 'ngx-virtual-scroller';
import { noop, Observable } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { HandoverDialogComponent } from 'src/app/features/auction-feature/delivery/handover-dialog/handover-dialog.component';
import { PostDetailsComponent } from 'src/app/features/auction-feature/delivery/post-details/post-details.component';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { Winner, WinnerOnAuction } from 'src/business/models/winner.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { mergeArrays } from 'src/business/services/items.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { BidsRepository } from 'src/business/services/repositories/bids.repository';
import { StorageService } from 'src/business/services/storage.service';
import { formatDateToHoursOnlyNgxCountdown } from 'src/business/utils/date.utils';
import { SubSink } from 'subsink';
import { WinnersRepository } from './../../../../../business/services/repositories/winners.repository';
import { WinnerDetailsDialogComponent } from './../winner-details-dialog/winner-details-dialog.component';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  providers: [AuctionRepository, BidsRepository, AuctionItemRepository, WinnersRepository, FunctionsService]
})
export class AdminPageComponent implements OnInit, OnDestroy {


  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly bidRepo: BidsRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly route: ActivatedRoute,
    public readonly mediaObs: MediaObserver,
    private readonly functionsSvc: FunctionsService,
    private readonly dialog: MatDialog,
    private readonly loadingSvc: ProgressBarService,
    private readonly toastSvc: HotToastService,
    private readonly storage: StorageService
  ) { }

  private _auctionId: string;

  auction$: Observable<Auction>;
  items$: Observable<AuctionItem[]>;
  winners: Map<string, Winner>;
  auctionWinners: WinnerOnAuction[];

  activeItemId: string;

  users = new Map<string, any>();
  bids$: Observable<Bid[]>;

  state: 'future' | 'active' | 'expired';
  config: CountdownConfig

  private _subsink = new SubSink();

  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('id');
    this.state = this.route.snapshot.paramMap.get('state') as 'future' | 'active' | 'expired';

    this.auction$ = this.auctionRepo.getOne(this._auctionId)
      .pipe(
        tap(auction => this.setupCountdown(auction)),
      );

      this._subsink.add(
        this.winnersRepo.getAuctionWinners(this._auctionId)
        .subscribe(winners => this.auctionWinners = winners)
      )

    this.onLoadMore({ endIndex: -1 } as IPageInfo);
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
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

    const subscription = this.itemsRepo.getScrollPage(this._auctionId, this.last)
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

  getBids(itemId: string) {
    this.activeItemId = itemId;

    const query = ref => ref.where('itemId', '==', itemId).orderBy("date", "desc").limit(5);
    this.bids$ = this.bidRepo.getAll(query);
  }

  /**Sets up countdown component to coundown to the end date time*/
  setupCountdown(auction: Auction) {
    const today = moment(new Date(), "DD/MM/YYYY HH:mm:ss");
    const auctionEnd = moment(auction.endDate.toDate(), "DD/MM/YYYY HH:mm:ss");
    const dateDiff = auctionEnd.diff(today);
    const duration = moment.duration(dateDiff);
    const leftTime = duration.asSeconds();

    this.config = { leftTime, format: "HHh mmm sss", formatDate: formatDateToHoursOnlyNgxCountdown }
  }

  openAuctionWinnersDetails() {

    this.dialog.open(WinnerDetailsDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'p-0',
      data: { winners: this.auctionWinners, auctionId: this._auctionId }
    });

  }

  endAuction(auctionId) {
    const dialogRef = this.dialog.open(HandoverDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'restrict-height-handover'
    });

    dialogRef.afterClosed()
    .pipe(take(1))
    .subscribe(handoverDetails => {
      if(!handoverDetails) return;

      this.functionsSvc.endAuction(auctionId, handoverDetails)
      .pipe(
        take(1),
        this.toastSvc.observe(
          {
            loading: 'Aukcija se zatvara..',
            success: "Uspješno završena aukcija",
            error: "Nešto je pošlo po zlu",
          }
        )
      )
      .subscribe(res => console.log(res), err => console.log(err)); // TODO: Something with res

    }, err => console.log(err))

  }

  changeHandoverDetails(auctionId) {

    const dialogRef = this.dialog.open(HandoverDialogComponent,  {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'restrict-height-handover'
    });

    dialogRef.afterClosed()
    .pipe(take(1))
    .subscribe(handoverDetails => {
      if(!handoverDetails || handoverDetails.length == 0) return;

      this.functionsSvc.changeHandoverDetails(auctionId, handoverDetails)
      .pipe(
        take(1),
        this.toastSvc.observe(
          {
            loading: 'Mijenjam..',
            success: "Uspješna izmjena",
            error: "Nešto je pošlo po zlu",
          }
        ),
      )
      .subscribe(res => console.log(res), err => console.log(err)); // TODO: Something with res

    }, err => console.log(err))

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

  openHandoverInformation(data) {

    const dialogRef = this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: 'auto',
      maxWidth: '98%',
      autoFocus: false,
      closeOnNavigation: true,
      data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(noop, err => console.log(err))

  }

  onItemDescription(item: AuctionItem) {
    this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: item.description
    });
  }

  async markPaymentStatus(change: MatButtonToggleChange, winner: Winner) {
    const paymentStatus = change.value as 'paid' | 'pending' | 'notpaid';

    const winnerUpdate = Object.assign({}, winner, { paymentStatus });
    const partialUpdate: Partial<AuctionItem> = { winner: winnerUpdate } ;

    await this.itemsRepo.update(this._auctionId, winner.itemId, partialUpdate);
  }

  onDownloadExcel(auction: Auction) {
    this.functionsSvc.exportAuction(this._auctionId)
    .pipe(
      take(1),
      this.toastSvc.observe(
        {
          loading: 'Priprema podataka..',
          success: "Uspješno exportano",
          error: "Nešto je pošlo po zlu",
        }
      ),
      switchMap(res => this.storage.getDownloadUrl(`exports/${auction.name}.xlsx`))
    )
    .subscribe(url => {
      window.location.href = url;
    }, console.log);
  }
}
