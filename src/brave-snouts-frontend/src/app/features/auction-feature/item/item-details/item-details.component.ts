import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { fadeIn } from 'src/business/animations/fade-in.animation';
import { itemAnimations } from 'src/business/animations/item.animations';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { AuthService } from 'src/business/services/auth.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { environment } from 'src/environments/environment';
import { SubSink } from 'subsink';
import { BidsRepository } from '../../../../../business/services/repositories/bids.repository';

@Component({
  selector: 'app-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository, BidsRepository],
  animations: [itemAnimations, fadeIn],
})
export class ItemDetailsComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    private readonly bidsRepo: BidsRepository,
    private readonly dialog: MatDialog,
    private readonly toastSvc: HotToastService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly router: Router,
    // private readonly gaService: GoogleAnalyticsService
  ) {
  }

  // Data
  @Input() auction: Auction;
  @Input() item: AuctionItem;
  @Input('trackedItems') userTrackedItems: Set<string>;

  // For animations
  // not observables because - animations are broken
  // https://github.com/angular/angular/issues/21331
  userId: string;
  userData: any;
  isAuthenticated: boolean;

  // Flags
  // disables bid related actions for a period of time
  bidDisabled: boolean;
  // used to trigger bid (price tag) change once it's definitive
  topBidChanged: boolean;
  topBidChanged$ = new Subject<boolean>();

  // bid controls
  currentBid: number;

  // component specific
  bootstrapped = false;
  private _subsink = new SubSink();

  // bid step size
  bidStepSize = environment.itemCardConfig.bidStepSize;

  // shareable item link
  get link() {
    return environment?.baseUrl + `/aukcije/predmet;auctionId=${this.auction?.id};itemId=${this.item?.id}`;
  }

  ngOnInit() {
    this.item.bid ??= this.item.startBid

    if (!this.auction) {
      this.auctionRepo.getOne(this.item.auctionId)
        .pipe(take(1)).subscribe(a => this.auction = a);
      // this.toastSvc.error("Nema informacija o aukciji!!!");
    }

    this.setupControls(this.item);

    this._subsink.add(
      ...this.onAuthDataChange(),
    )

    this.bootstrapped = true;
  }

  ngOnChanges(changes: SimpleChanges): void {

    const previousItem = changes.item?.previousValue;
    const currentItem = changes.item?.currentValue;

    if (!previousItem || !currentItem) {
      return;
    }

    if (previousItem.id != currentItem.id) {
      return;
    }

    if (JSON.stringify(previousItem) == JSON.stringify(currentItem)) {
      return;
    }

    const notNewRender = previousItem;
    const bidChanged = currentItem?.bid != previousItem?.bid;
    const userChanged = currentItem?.user != previousItem?.user;

    if (notNewRender && (bidChanged || userChanged)) {
      this.onItemChange();
    }
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  //#region Subscriptions and form controls

  /** Triggers when authenticated userId changes
   * Workaround for broken animation with async pipe
   * https://github.com/angular/angular/issues/21331
  */
  onAuthDataChange() {
    return [
      this.authSvc.user$
        .subscribe(user => (
          this.userId = user?.uid,
          this.userData = user,
          this.changeDetectorRef.detectChanges()
        )),

      this.authSvc.isAuthenticated$
        .subscribe(isAuth => (
          this.isAuthenticated = isAuth,
          this.changeDetectorRef.detectChanges()
        ))
    ]
  }

  /* Does work when item bid changes */
  onItemChange() {
    this.setupControls(this.item);
    this.disableBidding(750);
    this.topBidChange(750);
    // this.manualChangeDetection.queueChangeDetection();
  }

  /* Sets up bid controls and value */
  setupControls(item: AuctionItem) {
    this.currentBid = item.user ? item.bid : item.startBid;
  }
  //#endregion

  //#region Bidding

  topBidChange(timeout = 750) {
    this.topBidChanged = true;
    this.topBidChanged$.next(this.topBidChanged)
    setTimeout(() => (this.topBidChanged = false, this.topBidChanged$.next(this.topBidChanged)), timeout);
  }

  /* Disables bid button for XY milliseconds */
  disableBidding(timeout = 750) {
    this.bidDisabled = true;
    setTimeout(_ => this.bidDisabled = false, timeout);
  }

  /**
   * Places a bid on item
   * @param item item that the user is bidding on
   */
  async onBid(item: AuctionItem) {

    if (this.auction.endDate.toDate() < new Date()) {
      this.toastSvc.warning("Nažalost aukcija je završila");
      return this.router.navigate(["/"]);
    }

    item = Object.assign({}, item);

    if (!this.isBidValid)
      return;

    // guard with login

    // if not logged in prompt the user with it
    if (!this.isAuthenticated) {
      return await this.authSvc.login().pipe(take(1)).toPromise();
    }

    // continue only if user is logged in and we have data
    if (!this.userData || this.userData.providerData?.length == 0) {
      return;
    }

    const providerData = this.userData.providerData[0];
    let user = {
      uid: this.userId,
      name: providerData.displayName ?? null,
      email: providerData.email ?? null,
      avatar: providerData.photoURL ?? null
    }

    // check if someone placed bid in the middle of bidding of this user
    // item.user -> item the current user is bidding on and it's highest user
    // this.item.user -> realtime highest bidder on the item
    if (item.user != this.item.user) {
      // if someone placed the bid.. cancel this bid request
      console.warn('Somebody placed bid while you were in process of placing the bid');
      return null;
    }

    // construct bid
    let bid = new Bid({
      auctionId: item.auctionId,
      itemId: item.id,
      userId: this.userData.uid,
      userInfo: { name: user.name, avatar: user.avatar, email: user.email, id: this.userData.uid },
      date: this.bidsRepo.timestamp,
      bid: this.currentBid ?? item.bid + environment.itemCardConfig.minBidOffset,
      bidBefore: item.bid ?? null,
      userBefore: item?.user ?? null,
      bidIdBefore: item?.bidId ?? null
    });

    // add bid to historic collection
    const createdBid = await this.bidsRepo.create(bid);

    // update item bid data
    const bidData = { bidId: createdBid.id, bid: bid.bid, user: bid.userId, };
    await this.itemsRepo.update(item.auctionId, item.id, bidData);

    // add item to tracked collection
    if (!this.userTrackedItems?.has(item.id)) {
      await this.itemsRepo.addItemToUser(item, this.userId);
    }

    // if (bid.userId == bid.userBefore) {
    //   this.gaService.event('same-person-bid', 'auction-item');
    // }
  }

  /** Checks if bid is valid */
  public get isBidValid() {
    return this.currentBid > this.item.bid;
  }

  //#endregion

  //#region Item description
  onShowDescription(description: string) {
    this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: description
    });
  }

  isTruncated(element) {
    return element?.offsetWidth < element?.scrollWidth;
  }

  onLinkCopyFinished(success: boolean) {
    if (success) {
      this.toastSvc.success("Poveznica uspješno kopirana", {
        dismissible: true,
        position: 'top-center',
      })
    } else {
      this.toastSvc.success("Poveznica se nije uspjela kopirati", {
        dismissible: true,
        position: 'top-center'
      })
    }
  }
  //#endregion

  //#region Bid modification

  // TODO: Put into database
  // Bid modifier is step between bids 
  // (current 0.5EUR + or -)
  private readonly bidModifier = 1;

  subtractBid() {
    let currentModified = this.currentBid * 100;
    const bidModified = this.bidModifier * 100;

    currentModified -= bidModified;

    this.currentBid = Math.round(currentModified) / 100;
  }

  addBid() {
    let currentModified = this.currentBid * 100;
    const bidModified = this.bidModifier * 100;

    currentModified += bidModified;

    this.currentBid = Math.round(currentModified) / 100;
  }
  //#endregion

}
