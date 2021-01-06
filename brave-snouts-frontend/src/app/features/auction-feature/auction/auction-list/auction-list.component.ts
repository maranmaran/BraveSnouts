import { Component, OnDestroy, OnInit } from '@angular/core';
import { DocumentData, QueryFn } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import * as moment from 'moment';
import { noop, Observable, Subscription } from 'rxjs';
import { concatMap, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';

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

  auctions: Auction[];
  auctionsSub: Subscription;

  admin$: Observable<boolean>;

  ngOnInit(): void {

    this.admin$ = this.authSvc.isAdmin$;

    // Retrieve all active auctions with future end date
    let today = firebase.firestore.Timestamp.fromDate(new Date());
    let query: QueryFn<DocumentData> = ref => ref
      .where("endDate", '>=', today)
      .orderBy("endDate", 'desc');

    // additionally filter out those that didn't start yet
    this.loadingSvc.active$.next(true);
    this.auctionsSub = this.auctionRepo.getAll(query)
      .pipe(
        map(this.filterOutFutureStartDate),
      ).subscribe(
        auctions => {
          this.auctions = auctions;
          this.loadingSvc.active$.next(false);
        }
      )
  }

  ngOnDestroy(): void {
    this.auctionsSub.unsubscribe();
  }

  filterOutFutureStartDate(auctions: Auction[]) {
    if (auctions?.length == 0)
      return [];

    const isBefore = (auction: Auction) => moment(auction.startDate.toDate()).isBefore(new Date());

    return auctions.filter(isBefore);
  }

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

}
