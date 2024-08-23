import { AfterViewInit, Component, OnDestroy, OnInit, Renderer2, RendererStyleFlags2, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, firstValueFrom, of } from 'rxjs';
import { mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuthService } from 'src/business/services/auth.service';
import { BreakpointService } from 'src/business/services/breakpoint.service';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-user-items',
  templateUrl: './user-items.component.html',
  styleUrls: ['./user-items.component.scss'],
  providers: [AuctionItemRepository, ItemDialogService]

})
export class UserItemsComponent implements OnInit, AfterViewInit, OnDestroy {
  empty = false;
  total = 0;
  items: AuctionItem[] = [];
  isLoading$: Observable<boolean>;

  userId: string;

  winningItems: AuctionItem[] = [];
  outbiddedItems: AuctionItem[] = [];

  private _subsink = new SubSink();
  readonly isMobile$ = inject(BreakpointService).isMobile$;

  constructor(
    private readonly auctionsRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    private readonly loadingSvc: ProgressBarService,
    private readonly dialog: MatDialog,
    private readonly itemDialogSvc: ItemDialogService
  ) { }

  private readonly renderer = inject(Renderer2);

  async ngOnInit() {
    this.isLoading$ = this.loadingSvc.loading$;
    this.userId = await firstValueFrom(this.authSvc.userId$);
    this._subsink.add(
      this.getTrackedItems()
    );

    this.toggleHtmlVerticalScroll();
  }

  toggleHtmlVerticalScroll(hidden = true) {
    this.renderer.setStyle(
      document.getElementsByTagName("html")[0],
      'overflow-y',
      hidden ? 'hidden' : 'auto',
      RendererStyleFlags2.Important
    )
  }

  // Workaround for angular component issue #13870
  disableAnimation = true;
  ngAfterViewInit() {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => this.disableAnimation = false);
  }

  ngOnDestroy() {
    this.toggleHtmlVerticalScroll(false);
    this._subsink.unsubscribe();
  }

  getTrackedItems() {
    this.loadingSvc.loading$.next(true);

    return this.itemsRepo.getUserItems(this.userId).pipe(
      tap(items => this.total = items?.length),
      mergeMap(items => this.total > 0 ? [...items] : ["empty"]),
      mergeMap((item: any) => {

        if (item == "empty")
          return of(item);

        const idx = this.items.findIndex(it => it.id == item.id);

        if (idx != -1) {
          return of(this.items[idx]);
        }

        return this.itemsRepo.getOne(item.auctionId, item.id);
      }),
      withLatestFrom(this.auctionsRepo.getAuctionsWithState(['expired', 'active']))
    ).subscribe(([item, auctions]) => {

      if (item == "empty") {
        this.total = 0;
        this.items = [];
        setTimeout(() => this.loadingSvc.loading$.next(false))
        return;
      }


      const idx = this.items.findIndex(it => it.id == item.id);

      if (idx != -1) {
        this.items[idx] = item;
        this.items = [...this.items];
      } else {
        this.items = [...this.items, item];
      }

      const auctionsHash = new Set<string>(auctions.map(x => x.id));
      this.items = this.items.filter(i => auctionsHash.has(i.auctionId));

      this.winningItems = [...this.items.filter(item => item.user == this.userId)]
      this.outbiddedItems = [...this.items.filter(item => item.user != this.userId)]

      this.itemDialogSvc.items.next(this.items);
      setTimeout(() => this.loadingSvc.loading$.next(false))

    }, e => console.error(e));
  }

  trackByFn(_, item) {
    return item.id;
  }

}
