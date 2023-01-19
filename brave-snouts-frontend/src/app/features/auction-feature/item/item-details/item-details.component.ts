import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
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
    public readonly mediaObs: MediaObserver,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly router: Router,
    private readonly gaService: GoogleAnalyticsService
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

  // elements
  @ViewChild(MatSlider) slider: MatSlider;

  // Flags
  // disables bid related actions for a period of time
  bidDisabled: boolean;
  // used to trigger bid (price tag) change once it's definitive
  topBidChanged: boolean;
  topBidChanged$ = new Subject<boolean>();

  // bid controls
  currentBid: number;
  // bidControl: FormControl;
  bidSlider: number;

  // component specific
  bootstrapped = false;
  private _subsink = new SubSink();

  // bid step size
  bidStepSize = environment.itemCardConfig.bidStepSize;

  ngOnInit(): void {

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

    // console.log("\n\n")
    // console.log(currentItem?.name)
    // console.log(previousItem)
    // console.log(currentItem)
    // console.log("\n\n")

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
        ),
          err => console.log(err)),

      this.authSvc.isAuthenticated$
        .subscribe(isAuth => (
          this.isAuthenticated = isAuth,
          this.changeDetectorRef.detectChanges()
        ),
          err => console.log(err))
    ]
  }

  /* Does work when item bid changes */
  onItemChange() {
    this.setupControls(this.item);
    this.disableBidding(750);
    this.topBidChange(750);
    // this.manualChangeDetection.queueChangeDetection();
  }

  /* Sets up slider and custom bid control */
  setupControls(item: AuctionItem) {
    // this.bidControl = this.getBidControl(item.bid);
    // this._subsink.add(this.bidControl.valueChanges.subscribe(change => this.bidControlChange(change)));

    this.bidSlider = item.bid + environment.itemCardConfig.minBidOffset;

    this.currentBid = item.user ? item.bid : item.startBid;

    this.controlsValid = false;
  }
  //#endregion

  //#region Bidding

  topBidChange(timeout = 750) {
    this.topBidChanged = true;
    this.topBidChanged$.next(this.topBidChanged)
    setTimeout(() => (this.topBidChanged = false, this.topBidChanged$.next(this.topBidChanged)), timeout);
    // setTimeout(() => (this.topBidChanged = false, this.ChangeDetectorRef.detectChanges()), timeout);
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
      bid: this.getBidPrice() ?? item.bid + environment.itemCardConfig.minBidOffset,
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

    if (bid.userId == bid.userBefore) {
      this.gaService.event('same-person-bid', 'auction-item');
    }
  }

  /** Checks if bid is valid */
  public get isBidValid(): boolean {

    //TODO: Temp because of plus minus
    return this.currentBid > this.item.bid;

    if (this.lastTouchedControl == null)
      return false;

    if (this.lastTouchedControl == 'slider')
      return this.validateBidSlider();

    // return this.validateBidControl();
  }

  /** Validates slider bid */
  validateBidSlider() {
    const sliderBid = this.slider.value;
    const currentBid = this.currentBid;

    const errors: ValidationErrors = {};

    if (!sliderBid)
      errors['sliderNull'] = 'Vrijednost kliznika je neispravna';

    if (!currentBid)
      errors['currentNull'] = 'Trenutna vrijednost predmeta je neispravna';

    if (sliderBid <= currentBid)
      errors['sameBid'] = 'Ne može se dati ponuda manja ili jednaka trenutnoj';

    if (sliderBid % 5 != 0)
      errors['incrementOfFive'] = 'Ponuda mora biti višekratnik broja 5';

    const errorsCount = Object.keys(errors)?.length;
    if (Object.keys(errors)?.length > 0) {
      // console.log(errors);
    }

    // console.log("Validating slider", errors);

    return errorsCount == 0; // VALID if no errors
  }

  /** Validates custom input for bid */
  // validateBidControl() {
  //   const controlBid = this.bidControl.value;
  //   const controlBidValid = this.bidControl.valid;

  //   const currentBid = this.currentBid;

  //   let errors: ValidationErrors = this.bidControl.errors ?? {};

  //   if (!controlBid || !controlBidValid)
  //     errors['controlNull'] = 'Vrijednost ponude je neispravna';

  //   if (!currentBid)
  //     errors['currentNull'] = 'Trenutna vrijednost predmeta je neispravna';

  //   if (controlBid % 1 != 0 || /^\d+$/.test(controlBid) == false) {
  //     errors['decimal'] = "Cijena mora biti prirodan broj"
  //   }

  //   if (controlBid % 5 != 0) {
  //     errors['incrementOfFive'] = 'Ponuda mora biti višekratnik broja 5';
  //   }

  //   const errorsCount = Object.keys(errors)?.length;
  //   if (Object.keys(errors)?.length > 0) {
  //     this.bidControl.setErrors(errors);
  //   }

  //   // console.log("Validating control", errors);

  //   return errorsCount == 0; // VALID if no errors

  // }

  /* Gets current bid price from custom input and slider  */
  getBidPrice() {

    // TODO Temp because of minus plus
    return this.currentBid;

    if (this.lastTouchedControl == null)
      throw new Error("Can not put offer if no control was touched");

    if (this.lastTouchedControl == 'slider')
      return this.slider.value;

    // return this.bidControl.value;
  }

  lastTouchedControl?: 'control' | 'slider' = null;
  controlsValid = false;

  /* Selected price cache from slider */
  bidSliderChange(event: MatSliderChange) {
    this.bidSlider = event.value;

    // update price control
    // this.bidControl.setValue(event.value, { onlySelf: true, emitEvent: false });
    // this.bidControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });

    this.lastTouchedControl = 'slider';
    this.controlsValid = this.validateBidSlider();
  }

  /** Custom input bid change */
  // bidControlChange(event: any) {
  //   this.lastTouchedControl = 'control';
  //   this.controlsValid = this.validateBidControl();
  // }

  /* Tracking function for items. React in real time only on bid changes*/
  bidFn(item) {
    return item.bid
  }

  /* Scaffolds bid form control (located on the right of slider)*/
  getBidControl(currentBid) {
    return new FormControl(currentBid + environment.itemCardConfig.maxBidOffset, [
      Validators.min(currentBid + environment.itemCardConfig.minBidOffset), Validators.required]);
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
  //#endregion

  //#region Bid modification
  private readonly bidModifier = 0.7; // TODO: Put into database

  subtractBid() {
    this.currentBid -= this.bidModifier;
    this.currentBid = Math.ceil(this.currentBid * 100) / 100;
  }

  addBid() {
    this.currentBid += this.bidModifier;
    this.currentBid = Math.floor(this.currentBid * 100) / 100;
  }
  //#endregion


}
