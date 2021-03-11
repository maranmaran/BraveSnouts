import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IPageInfo } from 'ngx-virtual-scroller';
import { BehaviorSubject, of } from 'rxjs';
import { concatMap, map, take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { SubSink } from 'subsink';
import { AuthService } from './../../../../../business/services/auth.service';
import { AuctionItemRepository } from './../../../../../business/services/repositories/auction-item.repository';

@Component({
  selector: 'app-items-list-dialog',
  templateUrl: './items-list-dialog.component.html',
  styleUrls: ['./items-list-dialog.component.scss'],
  providers: [AuctionItemRepository]
})
export class ItemsListDialogComponent implements OnInit {

  items$: BehaviorSubject<AuctionItem[]>;

  private readonly _subsink = new SubSink();

  constructor(
    private readonly authSvc: AuthService,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly dialog: MatDialogRef<ItemsListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { auction: Auction, items: AuctionItem[], initItem: AuctionItem, initItemIdx: number, svc: ItemDialogService } = null
  ) { }

  ngOnInit(): void {

    this.items$ = new BehaviorSubject(this.data.items);

    this._subsink.add(
      this.onItemsChange()
    )

  }

  onClose() {
    this.dialog.close();
  }

  onItemsChange() {
    return this.data.svc.items.subscribe(items => {
      this.items$.next(items);
    });
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  onFetchMore(event: IPageInfo) {
    this.data.svc.fetchMore.next(event);
  }


  userTrackedItems: Set<string>;
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
