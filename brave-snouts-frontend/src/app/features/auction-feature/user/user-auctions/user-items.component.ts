import { getLocaleDateFormat } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { noop, Observable } from 'rxjs';
import { concatMap, finalize, map, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss'],
  providers: [AuctionItemRepository]
})
export class UserItemsComponent implements OnInit {

  trackedItems$: Observable<AuctionItem[]>;
  isLoading$: Observable<boolean>;

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
    private readonly loadingSvc: ProgressBarService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.loadingSvc.active$;
    this.trackedItems$ = this.getTrackedItems();
  }

  getTrackedItems() {
    this.loadingSvc.active$.next(true);
    return this.authSvc.userId$
    .pipe(
      take(1),
      concatMap(id => this.authSvc.getUserItems(id).pipe(take(1))),
      mergeMap(items => [...items]),
      mergeMap((item: any) => this.itemsRepo.getOne(item.auctionId, item.id).pipe(take(1))),
      toArray(),
      finalize(() => this.loadingSvc.active$.next(false))
    )
  }

  trackByFn(_, item) {
    return item.id;
  }
}
