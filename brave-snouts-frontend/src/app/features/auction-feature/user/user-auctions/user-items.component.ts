import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { mergeMap, take, tap } from 'rxjs/operators';
import { SingleItemDialogComponent } from 'src/app/features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuthService } from 'src/business/services/auth.service';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss'],
  providers: [AuctionItemRepository, ItemDialogService]

})
export class UserItemsComponent implements OnInit, AfterViewInit, OnDestroy {

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

  // Workaround for angular component issue #13870
  disableAnimation = true;
  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => this.disableAnimation = false);
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

      this.itemDialogSvc.items.next(this.items);
      // console.log(this.winningItems, this.outbiddedItems);

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
      width: '100%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: { item, svc: this.itemDialogSvc }
    });

    // dialogRef.afterClosed()

  }
}
