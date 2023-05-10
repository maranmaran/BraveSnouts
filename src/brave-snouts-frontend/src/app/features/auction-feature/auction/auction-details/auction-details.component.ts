import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { differenceInSeconds } from 'date-fns';
import { CountdownConfig } from 'ngx-countdown';
import { Observable, of } from 'rxjs';
import { concatMap, map, take, tap } from 'rxjs/operators';
import { itemAnimations } from 'src/business/animations/item.animations';
import { Auction } from 'src/business/models/auction.model';
import { AuthService } from 'src/business/services/auth.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { formatDateToHoursOnlyNgxCountdown } from 'src/business/utils/date.utils';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-auction-details',
  templateUrl: './auction-details.component.html',
  styleUrls: ['./auction-details.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository],
  animations: [itemAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuctionDetailsComponent implements OnInit, OnDestroy {

  constructor(
    private readonly route: ActivatedRoute,
    private readonly auctionsRepo: AuctionRepository,
    private readonly changeDetectionRef: ChangeDetectorRef,
    private readonly authSvc: AuthService,
    private itemsRepo: AuctionItemRepository
  ) { }

  _previousMoneyRaised: number = 0;
  moneyRaised: boolean = false;

  auction$: Observable<Auction>;

  private _subsink = new SubSink();

  config: CountdownConfig

  ngOnInit(): void {
    // Retrieve auction data
    let auctionId = this.route.snapshot.paramMap.get('id');

    this.getUserTrackedItems();

    this.auction$ = this.auctionsRepo.getOne(auctionId)
      .pipe(
        tap(auction => this.setupCountdown(auction))
      );

    this._subsink.add(

      this.auction$.pipe(map(auction => auction.raisedMoney)).subscribe(money => {
        if (money != this._previousMoneyRaised) {
          this.moneyRaised = true;
          setTimeout(() => (this.moneyRaised = false, this.changeDetectionRef.detectChanges()), 1000);
        }

        this._previousMoneyRaised = money;
      })

    )
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }


  /**Sets up countdown component to coundown to the end date time*/
  setupCountdown(auction: Auction) {
    const dateDiff = differenceInSeconds(
      auction.endDate.toDate(),
      new Date()
    );

    this.config = { leftTime: dateDiff, format: "HHh mmm sss", formatDate: formatDateToHoursOnlyNgxCountdown }
  }

  userTrackedItems: Set<string>;

  /** Retrieves user relevant items */
  getUserTrackedItems() {
    const userTrackedItems$ = this.authSvc.userId$
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

    this._subsink.add(
      userTrackedItems$.subscribe(items => this.userTrackedItems = items)
    )
  }


}
