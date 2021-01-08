import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentData, QueryFn } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import * as moment from 'moment';
import { noop, Observable, Subscription } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { concatMap, distinctUntilChanged, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-auction-list',
  templateUrl: './auction-list.component.html',
  styleUrls: ['./auction-list.component.scss']
})
export class AuctionListComponent implements OnInit, OnDestroy {

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly router: Router,
    private readonly loadingSvc: ProgressBarService,
    protected readonly mediaObs: MediaObserver,
    protected readonly authSvc: AuthService,
    private readonly itemRepo: AuctionItemRepository,
    private readonly dialog: MatDialog,
  ) { }

  auctions$: Observable<Auction[]>;
  admin$: Observable<boolean>;

  adminSub: Subscription;

  ngOnInit(): void {
    this.admin$ = this.authSvc.isAdmin$;

    this.adminSub = this.admin$.pipe(distinctUntilChanged()).subscribe(admin => this.initList(admin))
  }

  ngOnDestroy(): void {
    this.adminSub.unsubscribe();
  }

  //#region Component bootstrapping and list retrieval

  /** Initializes auctions list component with correct data
     * @param admin Whether or not user is admin 
     */
  initList(admin: boolean) {

    // console.log(`Initializing list | Admin - ${admin}`); // debug

    // retrieve appropriate query
    const query = admin ? this.allAuctionsSortedQuery : this.notFinishedAuctionsSortedQuery;

    // get the auctions
    let auctions$ = this.auctionRepo.getAll(query);

    /** If regular user. They don't need to see non started auctions (future ones) */
    if (!admin) {
      auctions$ = auctions$.pipe(map(auctions => this.filterOutFutureStartDate(auctions)));
    // custom order for admins
    } else {
      auctions$ = auctions$.pipe(map(auctions => this.sortAdminAuctions(auctions)));
    }

    // progress bar - loading
    this.loadingSvc.active$.next(true);
    this.auctions$ = auctions$.pipe(
      tap(() => this.loadingSvc.active$.next(false))
    );
  }

  /* Retrieves only active auctions */
  private get notFinishedAuctionsSortedQuery(): QueryFn<firebase.firestore.DocumentData> {
    let today = firebase.firestore.Timestamp.fromDate(new Date());
    return ref => ref
      .where("endDate", '>=', today)
      .orderBy("endDate", 'desc');
  }

  /* Admin has right to see all auctions. Sorted by endDate */
  private get allAuctionsSortedQuery(): QueryFn<firebase.firestore.DocumentData> {
    return ref => ref; // @see {sortAdminAuctions (auction-list.component.ts)}
  }

  /* Filters out auctions with start date in the future */
  filterOutFutureStartDate(auctions: Auction[]) {
    if (auctions?.length == 0)
      return [];

    // this is fine because firebase translates Timestamp to user browser local time
    const isBefore = auction => !this.isFutureAuction(auction);

    return auctions.filter(isBefore);
  }

  /**Sorts custom for admin view active in middle, future top, expired bottom */
  sortAdminAuctions(auctions: Auction[]) {
    let expired = auctions.filter(a => this.isExpiredAuction(a));
    let future = auctions.filter(a => this.isFutureAuction(a));
    let active = auctions.filter(a => !this.isExpiredAuction(a) && !this.isFutureAuction(a));
    return [...future, ...active, ...expired];
  }
  //#endregion

  //#region Auction actions (navigate, edit, delete)

  /**Navigate to selected auction */
  onClick(auction: Auction) {
    this.router.navigate(['auction', { id: auction.id }])
  }

  onEdit(auctionObj: Auction, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    let auction = {
      id: auctionObj.id,
      name: auctionObj.name,
      startDate: auctionObj.startDate.toDate(),
      endDate: auctionObj.endDate.toDate()
    }

    this.itemRepo.getAll(auctionObj.id).pipe(take(1))
      .subscribe(items => this.router.navigate(
        ['edit-auction'],
        { state: { auction, items, action: 'edit' } }
      ));

  }

  onDelete(auctionObj: Auction, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      data: { text: `Sigurno želiš obrisati aukciju ${auctionObj.name} ?`, yes: 'Želim', no: 'Ne želim' }
    });

    return dialogRef.afterClosed().pipe(take(1))
      .subscribe(method => {

        if (!method)
          return;

        // delete items subcollection
        // finally delete auction
        this.itemRepo.getAll(auctionObj.id)
          .pipe(
            take(1),
            map(items => items.map(item => this.itemRepo.delete(auctionObj.id, item.id))),
            concatMap(deletePromises => Promise.all(deletePromises)),
            concatMap(() => this.auctionRepo.delete(auctionObj.id)),
          ).subscribe(noop)

      })

  }

  onViewBids(auctionObj: Auction, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.router.navigate(['bids', { id: auctionObj.id }])
  }

  //#endregion

  /**Auction that is set in future and is yet to come */
  isFutureAuction(auction: Auction) {
    return moment(auction.startDate.toDate()).isAfter(new Date());
  }

  /**Auction that has ended and/or is processed by firebase function*/
  isExpiredAuction(auction: Auction) {
    return (moment(auction.endDate.toDate()).isBefore(new Date()) || auction.processed) && !this.isFutureAuction(auction); 
  }

}
