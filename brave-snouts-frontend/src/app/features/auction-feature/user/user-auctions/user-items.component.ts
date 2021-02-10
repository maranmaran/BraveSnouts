import { getLocaleDateFormat } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { noop, Observable } from 'rxjs';
import { concatMap, finalize, map, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss'],
  providers: [AuctionItemRepository]
})
export class UserItemsComponent implements OnInit, OnDestroy {

  useGallery = true;

  total: number = 0;
  items: AuctionItem[] = [];
  isLoading$: Observable<boolean>;

  private _subsink = new SubSink();

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
    private readonly loadingSvc: ProgressBarService,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.loadingSvc.active$;
    this._subsink.add(
      this.getTrackedItems()
      );
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  getTrackedItems() {
    this.loadingSvc.active$.next(true);
    return this.authSvc.userId$
    .pipe(
      take(1),
      concatMap(id => this.itemsRepo.getUserItems(id).pipe(take(1))),
      tap(items => this.total = items?.length),
      mergeMap(items => [...items]),
      mergeMap((item: any) => this.itemsRepo.getOne(item.auctionId, item.id)),
    ).subscribe(item => {
      const idx = this.items.findIndex(it => it.id == item.id);
      if(idx != -1) {
        this.items[idx] = item
      } else {
        this.items.push(item);
      }
      
      if(this.items?.length == this.total) {
        setTimeout(() => this.loadingSvc.active$.next(false));
      }

    });
  }

  trackByFn(_, item) {
    return item.id;
  }
}
