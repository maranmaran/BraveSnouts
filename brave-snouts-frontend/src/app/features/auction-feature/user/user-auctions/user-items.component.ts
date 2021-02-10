import { getLocaleDateFormat } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { noop, Observable, of } from 'rxjs';
import { concatMap, finalize, map, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { SingleItemDialogComponent } from 'src/app/features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { ItemDialogService } from 'src/business/services/item-dialog.service';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss'],
  providers: [AuctionItemRepository, ItemDialogService]

})
export class UserItemsComponent implements OnInit, OnDestroy {

  useGallery = true;

  empty: boolean = false;
  total: number = 0;
  items: AuctionItem[] = [];
  isLoading$: Observable<boolean>;

  userId: string;

  winningItems: AuctionItem[] = [];
  outbiddedItems: AuctionItem[] = [];

  private _subsink = new SubSink();

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
    private readonly loadingSvc: ProgressBarService,
    private readonly dialog: MatDialog,
    private readonly itemDialogSvc: ItemDialogService
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this.loadingSvc.active$;
    this.authSvc.userId$
    .pipe(take(1))
    .subscribe(id => {
      this.userId = id

      this._subsink.add(
        this.getTrackedItems()
        );
    });
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  getTrackedItems() {
    
    this.loadingSvc.active$.next(true);
    return this.itemsRepo.getUserItems(this.userId).pipe(
      tap(items => this.total = items?.length),
      mergeMap(items => this.total > 0 ? [...items] : [ "empty" ] ),
      mergeMap((item: any) => {

        if(item == "empty")
          return of(item);

        const idx = this.items.findIndex(it => it.id == item.id);

        return idx != -1 ? of(this.items[idx]) : this.itemsRepo.getOne(item.auctionId, item.id);
      }),
      ).subscribe(item => {
      
      if(item == "empty") {
        this.total = 0;
        this.items = [];
        setTimeout(() => this.loadingSvc.active$.next(false));
        return;
      }
      
      const idx = this.items.findIndex(it => it.id == item.id);
      
      if(idx != -1) {
        this.items[idx] = item;
        this.items = [...this.items];
      } else {
        this.items = [...this.items, item];
      }
      
      this.winningItems = [...this.items.filter(item => item.user == this.userId)]
      this.outbiddedItems = [...this.items.filter(item => item.user != this.userId)]

      console.log(this.winningItems, this.outbiddedItems);

      if(this.items?.length == this.total) {
        setTimeout(() => this.loadingSvc.active$.next(false));
      }

    });
  }

  trackByFn(_, item) {
    return item.id;
  }

  openItem(item: AuctionItem) {

    let dialogRef = this.dialog.open(SingleItemDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: { item, svc: this.itemDialogSvc }
    });

    // dialogRef.afterClosed()

  }
}
