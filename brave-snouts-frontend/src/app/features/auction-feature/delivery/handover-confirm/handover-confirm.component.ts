import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { noop, Subscription, throwError } from 'rxjs';
import { catchError, map, mergeMap, take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';

@Component({
  selector: 'app-handover-confirm',
  templateUrl: './handover-confirm.component.html',
  styleUrls: ['./handover-confirm.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository, FunctionsService],
})
export class HandoverConfirmComponent implements OnInit, OnDestroy {

  success: boolean;
  bootstrap: boolean = false;


  private _auctionId: string;
  private _userId: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly router: Router,
    private readonly auctionRepo: AuctionRepository,
    private readonly functionSvc: FunctionsService,
  ) { }

  _sub: Subscription;

  handoverDetails: string[];

  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('auctionId');
    this._userId = this.route.snapshot.paramMap.get('userId');

    if(!this._auctionId || !this._userId) {
      console.log("Redirecting")
      this.router.navigate(['/app']);
      return null;
    }

    console.log("Submitting")
    setTimeout(() => {
      this.getHnadoverOptions();
    }, 1500)
  }

  getHnadoverOptions() {
    this.auctionRepo.getOne(this._auctionId)
    .pipe(
      take(1),
      map(a => a.handoverDetails)
    )
    .subscribe(details => {
      this.handoverDetails = details;
    });
  }

  ngOnDestroy() {
  }

  onSubmit(option: string) {

    // update winner post delivery option data
    let query = ref => ref.where('winner.userId', '==', this._userId);

    let items$ = this.itemsRepo.getAll(this._auctionId, query);

    return items$.pipe(
      take(1),
      mergeMap(items => [...items]),
      map(item => item.winner),
      map(winner => [winner.itemId, Object.assign({}, winner, { postalInformation: null, deliveryChoice: 'handover', handoverOption: option }) ]),
      mergeMap(([id, data]) => {

        var partialData = { winner: data } as AuctionItem;

        return this.itemsRepo.getDocument(this._auctionId, id as string).set(partialData, {merge: true})
      }),
      catchError(err => (console.log(err), throwError(err) ) ),
    ).subscribe(
      () => this.success = true,
      err => (console.log(err), this.success = false),
      () => (this.sendConfirmation(option), this.bootstrap = true)
    );;

  }

  sendConfirmation(option) {
    this.functionSvc.sendHandoverConfirm(this._userId, this._auctionId, option).pipe(take(1)).subscribe(noop)
  }


}
