import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, noop } from 'rxjs';
import { map, mergeMap, take, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Winner, WinnerOnAuction } from 'src/business/models/winner.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { WinnersRepository } from 'src/business/services/repositories/winners.repository';

@Component({
  selector: 'app-handover-confirm',
  templateUrl: './handover-confirm.component.html',
  styleUrls: ['./handover-confirm.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository, FunctionsService, WinnersRepository],
})
export class HandoverConfirmComponent implements OnInit, OnDestroy {

  success: boolean;
  bootstrap: boolean = false;

  private _auctionIds: string[];
  private _userId: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly router: Router,
    private readonly auctionRepo: AuctionRepository,
    private readonly winnerRepo: WinnersRepository,
    private readonly functionSvc: FunctionsService,
  ) { }

  _sub: Subscription;

  handoverDetails: string[];

  ngOnInit(): void {
    this._auctionIds = this.route.snapshot.paramMap.get('auctionIds').split(',');
    this._userId = this.route.snapshot.paramMap.get('userId');

    if (!this._auctionIds || !this._userId) {
      this.router.navigate(['/aukcije']);
      return null;
    }

    setTimeout(() => {
      this.getHnadoverOptions();
    }, 1500)
  }

  getHnadoverOptions() {
    this.auctionRepo.getOne(this._auctionIds[0])
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

    let updateJobs = [];
    for (const auctionId of this._auctionIds) {

      let items$ = this.itemsRepo.getAll(auctionId, query);

      let updateJob = items$.pipe(
        take(1),
        mergeMap(items => [...items]),
        map(item => item.winner),
        tap(async winner => {

          let winnerOnAuction = new WinnerOnAuction({
            id: winner.userId,
            auctionId: winner.auctionId,
            deliveryChoice: 'handover',
            handoverOption: option
          });

          await this.winnerRepo.setAuctionWinner(winner.auctionId, winnerOnAuction);
        }),
        map((winner: Winner) => [winner.itemId, Object.assign({}, winner, { postalInformation: null, deliveryChoice: 'handover', handoverOption: option })]),
        mergeMap(([id, data]) => {

          var partialData = { winner: data } as AuctionItem;

          return this.itemsRepo.getDocument(auctionId, id as string).set(partialData, { merge: true })
        })
      );

      updateJobs.push(updateJob.toPromise());
    }

    Promise.all(updateJobs)
      .then(() => (this.sendConfirmation(option), this.success = true))
      .catch(err => (console.error(err), this.success = false))
      .finally(() => this.bootstrap = true);
  }

  sendConfirmation(option) {
    this.functionSvc.sendHandoverConfirm(this._userId, this._auctionIds, option).pipe(take(1)).subscribe(noop)
  }


}
