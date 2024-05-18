import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { concatMap, map, take } from 'rxjs/operators';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';
import { AuthService } from './../../../../../business/services/auth.service';
import { AuctionRepository } from './../../../../../business/services/repositories/auction.repository';

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository]
})
export class SingleItemComponent implements OnInit, OnDestroy {

  @Input() fromDialog: boolean = false;

  readonly authenticated$ = this.authSvc.isAuthenticated$;
  private readonly _subsink = new SubSink();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authSvc: AuthService,
    private readonly itemRepo: AuctionItemRepository,
    private readonly auctionRepo: AuctionRepository,
  ) { }

  ngOnInit(): void {

    setTimeout(() => {
      if (!this.fromDialog) {
        const auctionId = this.route.snapshot.paramMap.get('auctionId');
        const itemId = this.route.snapshot.paramMap.get('itemId');

        if (!auctionId || !itemId) {
          this.router.navigate(['/aukcije']);
        } else {
          this._subsink.add(
            this.getAuction(auctionId),
            this.getItem(auctionId, itemId),
          )
        }
      }
    })
  }

  auction: Auction;
  getAuction(auctionId) {
    return this.auctionRepo.getOne(auctionId).pipe(take(1)).subscribe((a: Auction) => this.auction = a)
  }

  @Input() item$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  getItem(auctionId, itemId) {
    return this.itemRepo.getOne(auctionId, itemId).subscribe(
      item => {
        this.item$.next(item);
      }
    )
  }

  userTrackedItems: Set<string>;
  getUserTrackedItems() {
    const userTrackedItems$ = this.authSvc.userId$
      .pipe(
        concatMap(userId => {

          if (!userId) return of(null);

          return this.itemRepo.getUserItems(userId).pipe(take(1))
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

  toAuction(auction: Auction) {
    this.router.navigate(['/aukcije/aukcija', { id: auction.id }], { state: { auction } });
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

}
