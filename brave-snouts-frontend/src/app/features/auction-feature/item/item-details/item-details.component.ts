import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentData, QueryFn } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { from, noop, Observable, of } from 'rxjs';
import { concatMap, filter, skip, take, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Bid } from 'src/business/models/bid.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuthService } from 'src/business/services/auth.service';
import { environment } from 'src/environments/environment';
import { SubSink } from 'subsink';
import { BidsRepository } from './../../../../../business/services/bids.repository';

@Component({
  selector: 'app-item-details',
  templateUrl: './item-details.component.html',
  styleUrls: ['./item-details.component.scss'],
  animations: [
    trigger('skipInitAnimation', [
      transition(':enter', [])
    ]),
    trigger('priceOnBidChanged', [
      state('no-change', style({})),
      state('change', style({ color: '#0a94a7', transform: "scale(1.4)" })),
      transition('no-change <=> change', animate('225ms ease-in-out'))
    ]),
    trigger('starOnBidChanged', [
      state(':enter', style({})),
      state(':leave', style({})),
      transition(':enter',
        animate('0.7s', keyframes([
          style({ opacity: 1 }),
          style({ transform: 'scale(1) translateY(0)' }),
          style({ transform: 'scale(1.1) translateY(-8px)' }),
          style({ transform: 'scale(1) translateY(0)' }),
          style({ transform: 'scale(1.05) translateY(-4px)' }),
          style({ transform: 'scale(1) translateY(0)' }),
        ])),
      )
    ])
  ]
})
export class ItemDetailsComponent implements OnInit, OnChanges, OnDestroy {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    private readonly bidsRepo: BidsRepository,
    public readonly mediaObs: MediaObserver,
  ) { }

  // Data
  @Input() item: AuctionItem;
  @Input('trackedItems') userTrackedItems: Set<string>;

  // For animations 
  // not observables because - animations are broken
  // https://github.com/angular/angular/issues/21331
  userId: string
  isAuthenticated: boolean;

  // elements
  @ViewChild(MatSlider) slider: MatSlider;

  // Flags
  // disables bid related actions for a period of time
  bidDisabled: boolean;
  // used to trigger bid (price tag) change once it's definitive
  topBidChanged: boolean;

  // bid controls
  currentBidControl: FormControl;
  sliderBid: number;

  // component specific
  bootstrapped = false;
  private _subsink = new SubSink();

  // bid step size
  bidStepSize = environment.itemCardConfig.bidStepSize;

  ngOnInit(): void {
    
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

    if(JSON.stringify(previousItem) == JSON.stringify(currentItem)) {
      return;
    }

    const notNewRender = previousItem;
    const bidChanged = currentItem?.bid != previousItem?.bid;
    const userChanged = currentItem?.user != previousItem?.user;

    if(notNewRender && (bidChanged || userChanged)) {
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
      this.authSvc.userId$.subscribe(userId => this.userId = userId, err => console.log(err)),
      this.authSvc.isAuthenticated$.subscribe(isAuth => this.isAuthenticated = isAuth, err => console.log(err))
    ]
  }

  /* Does work when item bid changes */
  onItemChange() {
    this.setupControls(this.item);
    this.disableBidding(750);
    this.topBidChange(750);
  }
 
  /* Sets up slider and custom bid control */
  setupControls(item: AuctionItem) {
    this.currentBidControl = this.getBidControl(item.bid);
    this.sliderBid = item.bid + environment.itemCardConfig.minBidOffset;
  }
  //#endregion

  //#region Bidding

  topBidChange(timeout = 750) {
    this.topBidChanged = true;
    setTimeout(() => this.topBidChanged = false, timeout);
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
  onBid(item: AuctionItem) {

    item = Object.assign({}, item);

    if (!this.checkBidPrice(item))
      return;

    // guard with login
    from(this.authSvc.login())
      .pipe(
        take(1),
        concatMap(_ => this.authSvc.user$.pipe(take(1))),
        filter(user => !!user),
      )
      .subscribe(user => {

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
          itemId: item.id,
          userId: user.uid,
          userInfo: { name: user.displayName, avatar: user.photoURL, email: user.email},
          date: this.bidsRepo.timestamp,
          bid: this.getBidPrice(item.bid) ?? item.bid + environment.itemCardConfig.minBidOffset,
        });

        // update bids array for historic data
        // create bid and update item
        from(this.bidsRepo.create(bid))
        .pipe(
          take(1),
          concatMap(createdBid => {
            let bidData = { bidId: createdBid.id, bid: bid.bid, user: bid.userId, }; 
            let action = this.itemsRepo.update(item.auctionId, item.id, bidData);
            return from(action).pipe(take(1))
          }),
          concatMap(async () => {

            if(this.userTrackedItems && this.userTrackedItems.has(item.id)) {
              return of(null);
            }

            return from(this.itemsRepo.addItemToUser(item, this.userId)).pipe(take(1));
          }),
          take(1),
        ).subscribe(noop, err => console.log(err));

      });
  }

  /* Validates current bid price */
  checkBidPrice(item: AuctionItem) {
    try {
      return !!this.getBidPrice(item.bid);
    } catch (error) {
      return false;
    }
  }

  /* Gets current bid price from custom input and slider  */
  getBidPrice(currentBid: number) {
    if (this.currentBidControl.invalid) {
      throw new Error("Invalid control");
    }

    let inputBid = this.currentBidControl.value;
    let sliderBid = this.sliderBid;

    // slider value (between min and max)
    if (inputBid <= currentBid + environment.itemCardConfig.maxBidOffset) {
      return sliderBid; // this is what user wants
    }

    // custom input value.. more then max slider
    // otherwise user probably input custom value
    // Validate if it's natural number (non decimal && > 0)
    if (inputBid % 1 != 0) {
      let errors: ValidationErrors = {
        'decimal': 'Number can not be decimal'
      };
      this.currentBidControl.setErrors(errors);
      throw new Error('Number can not be decimal');
    } else {
      this.currentBidControl.setValue(inputBid, { onlySelf: true, emitEvent: false });
    }

    return inputBid;
  }

  /* Selected price cache from slider */
  bidChange(event: MatSliderChange) {
    this.sliderBid = event.value;

    // update price control
    this.currentBidControl.setValue(event.value, { onlySelf: true, emitEvent: false });
    this.currentBidControl.markAsTouched();
    this.currentBidControl.markAsDirty();
    this.currentBidControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  /* Formats selected price on slider */
  formatBid(value: number) {
    return value + 'kn'
  }

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

}
