import { Component, OnDestroy, OnInit } from '@angular/core';
import { QueryFn } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { MediaObserver } from 'ngx-flexible-layout';
import { Observable, Subscription, from, noop, of } from 'rxjs';
import { concatMap, distinctUntilChanged, finalize, map, take, tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { fadeIn } from 'src/business/animations/fade-in.animation';
import { Auction } from 'src/business/models/auction.model';
import { getAuctionState } from 'src/business/services/auction.service';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';

@Component({
  selector: 'app-auction-list',
  templateUrl: './auction-list.component.html',
  styleUrls: ['./auction-list.component.scss'],
  animations: [fadeIn],
  providers: [AuctionItemRepository, AuctionRepository]
})
export class AuctionListComponent implements OnInit, OnDestroy {

  constructor(
    private readonly auctionRepo: AuctionRepository,
    protected readonly authSvc: AuthService,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly router: Router,
    private readonly loadingSvc: ProgressBarService,
    protected readonly mediaObs: MediaObserver,
    private readonly dialog: MatDialog,
  ) { }

  auctions$: Observable<Auction[]>;
  admin$: Observable<boolean>;
  userTracksItems$: Observable<boolean>;

  adminSub: Subscription;
  auctionsBootstrapped = false;

  totalDonated?: number = null;

  ngOnInit(): void {
    this.admin$ = this.authSvc.isAdmin$;
    this.userTracksItems$ = this.getIfUserTrackesItems();

    this.adminSub = this.admin$.pipe(distinctUntilChanged())
      .subscribe(
        admin => this.initList(admin),
        err => console.log(err)
      )
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
      auctions$ = auctions$.pipe(map(auctions => this.filterOutArchived(auctions)));
      // auctions$ = auctions$.pipe(map(auctions => this.filterOutFutureStartDate(auctions)));
      // custom order for admins
    } else {
      auctions$ = auctions$.pipe(map(auctions => this.sortAdminAuctions(auctions)));
    }

    // progress bar - loading
    this.loadingSvc.active$.next(true);
    this.auctions$ = auctions$.pipe(
      tap(auctions => {
        this.totalDonated = auctions.filter(a => this.getAuctionState(a) == 'active')
          .reduce((prev, cur) => prev += cur.raisedMoney, 0);

        this.totalDonated = Math.round(this.totalDonated * 100) / 100;
      }),
      tap(() => this.loadingSvc.active$.next(false)),
      tap(() => this.auctionsBootstrapped = true),
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
    return ref => ref.where('archived', '==', false); // @see {sortAdminAuctions (auction-list.component.ts)}
  }

  /* Filters out auctions with start date in the future */
  filterOutFutureStartDate(auctions: Auction[]) {
    if (auctions?.length == 0)
      return [];

    // this is fine because firebase translates Timestamp to user browser local time
    const isBefore = auction => this.getAuctionState(auction) != 'future';

    return auctions.filter(isBefore);
  }

  /* Filters out auctions that are archived */
  filterOutArchived(auctions: Auction[]) {
    if (auctions?.length == 0)
      return [];

    return auctions
      .filter(a => a.archived == false)
      .filter(a => a.processed == false)
      .filter(a => this.getAuctionState(a) != 'expired');
  }

  /**Sorts custom for admin view active in middle, future top, expired bottom */
  sortAdminAuctions(auctions: Auction[]) {
    let expired = auctions.filter(a => this.getAuctionState(a) == 'expired');
    let future = auctions.filter(a => this.getAuctionState(a) == 'future');
    let active = auctions.filter(a => this.getAuctionState(a) == 'active');
    return [...future, ...active, ...expired];
  }

  /** Returns whether or not user tracks any auction items */
  getIfUserTrackesItems() {
    return this.authSvc.userId$
      .pipe(
        concatMap(id => id ? this.itemsRepo.getUserItems(id).pipe(take(1)) : of(null)),
        map(items => !!items)
      )
  }

  //#endregion

  //#region Auction actions (navigate, edit, delete)

  /**Navigate to selected auction */
  onClick(auction: Auction) {
    this.router.navigate(['/aukcije/aukcija', { id: auction.id }], { state: { auction } });
  }

  onEdit(auctionObj: Auction, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    let auction = {
      id: auctionObj.id,
      name: auctionObj.name,
      startDate: auctionObj.startDate,
      endDate: auctionObj.endDate,
      raisedMoney: auctionObj.raisedMoney,
    }

    this.itemsRepo.getAll(auctionObj.id).pipe(take(1))
      .subscribe(items => this.router.navigate(
        ['/app/izmjena-aukcije'],
        { state: { auction, items, action: 'edit' } }
      ), err => console.log(err));

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
        this.loadingSvc.active$.next(true);
        this.itemsRepo.getAll(auctionObj.id)
          .pipe(
            take(1),
            map(items => items.map(item => this.itemsRepo.delete(auctionObj.id, item.id))),
            concatMap(deletePromises => from(Promise.all(deletePromises))),
            concatMap(() => this.auctionRepo.delete(auctionObj.id)),
            concatMap(() => this.itemsRepo.deleteTrackedItems(auctionObj.id)),
            finalize(() => this.loadingSvc.active$.next(false))
          ).subscribe(noop, err => console.log(err))
      })

  }

  onViewBids(auctionObj: Auction, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.router.navigate(['/aukcije/aukcija-administracija', { id: auctionObj.id, state: this.getAuctionState(auctionObj) }])
  }

  onViewDescription(auction: Auction, event: Event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: auction.description
    });
  }

  //#endregion

  getAuctionState(auction: Auction): 'future' | 'active' | 'expired' {
    return getAuctionState(auction);
  }


}
