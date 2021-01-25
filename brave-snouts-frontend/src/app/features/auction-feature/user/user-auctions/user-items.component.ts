import { getLocaleDateFormat } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { noop, Observable } from 'rxjs';
import { concatMap, map, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss']
})
export class UserItemsComponent implements OnInit {

  trackedItems$: Observable<AuctionItem[]>;

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
  ) { }

  ngOnInit(): void {
    this.trackedItems$ = this.getTrackedItems();
  }

  getTrackedItems() {
    return this.authSvc.userId$
    .pipe(
      take(1),
      concatMap(id => this.itemsRepo.getUserItems(id).pipe(take(1))),
      mergeMap(items => [...items]),
      mergeMap((item: any) => this.itemsRepo.getOne(item.auctionId, item.id).pipe(take(1))),
      toArray(),
    )
  }

  trackByFn(_, item) {
    return item.id;
  }
}
