import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DocumentData, QueryFn } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatSlider, MatSliderChange } from '@angular/material/slider';
import { Guid } from 'guid-typescript';
import { from, Observable } from 'rxjs';
import { of } from 'rxjs/internal/observable/of';
import { concatMap, delay, distinctUntilChanged, filter, skip, switchMap, take, tap } from 'rxjs/operators';
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
export class ItemDetailsComponent implements OnInit, OnDestroy {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly authSvc: AuthService,
    private readonly bidsRepo: BidsRepository,
    public readonly mediaObs: MediaObserver,
  ) { }

  // Data
  @Input() item: AuctionItem;
  userId$: Observable<string>;
  isAuthenticated$: Observable<boolean>;
  bids: Bid[]; // item bids

  // workaround because animations are broken
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
    this.userId$ = this.authSvc.userId$;
    this.isAuthenticated$ = this.authSvc.isAuthenticated$;

    this.setupControls(this.item);

    this.bootstrapped = true;

    // react to changes only (skip first)
    setTimeout(async _ => {
      this._subsink.add(
        this.onBidsChange(this.item.id),
        this.onItemChange(),
        ...this.onAuthDataChange(),
      )
    });
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
      this.userId$.subscribe(userId => this.userId = userId),
      this.isAuthenticated$.subscribe(isAuth => this.isAuthenticated = isAuth)
    ]
  }

  /* Does work when item bid changes */
  onItemChange() {
    const document = this.itemsRepo.getOne(this.item.auctionId, this.item.id);

    return document.pipe(
      skip(1),
      filter(nextItem => nextItem.bid != this.item.bid || nextItem.user != this.item.user),
      // switchmap because if two items come in ALMOST same time
      // second coming in (newest) will interrupt procedures from first and reset
      // meaning user won't see flashing STAR and PRICE animations 
      // switchMap(item => of(item)
      //   .pipe(
      //     tap(() => this.disableBidding(1250)),
      //     delay(250),
      //   )
      // ),
    )
      .subscribe(item => {
        this.item = item;
        this.setupControls(item);
        this.disableBidding(750);
        this.topBidChange(750);
      });
  }

  /* Watches and updates bids collection to track all bids on current item */
  onBidsChange(itemId: string) {

    const query: QueryFn<DocumentData> = ref => ref
      .where("itemId", '==', itemId)
      .orderBy("date", 'desc');

    return this.bidsRepo.getAll(query)
      .pipe(
        // firebase server timestamp triggers collection events twice
        // first time it's saved as date: null and then it modifies that field
        // with actual firebase server time
        // causing document to trigger 'modified' event and value change
        filter(bids => bids.length == 0 ? true : bids[0].date != null),
      )
      .subscribe(bids => this.bids = bids)
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

  /* Places a bid on item */
  onBid(item: AuctionItem) {

    item = Object.assign({}, item);

    if (!this.checkBidPrice(item))
      return;

    // guard with login
    from(this.authSvc.login())
      .pipe(
        take(1),
        concatMap(_ => this.authSvc.user$),
        filter(user => !!user))
      .subscribe(user => {

        if (item.user != this.item.user) {
          console.log('Somebody placed bid while you were in process of placing the bid');
        }

        let bid = new Bid({
          itemId: item.id,
          userId: user.uid,
          userInfo: { name: user.displayName, avatar: user.photoURL, email: user.email},
          date: this.bidsRepo.timestamp,
          bid: this.getBidPrice(item.bid) ?? item.bid + environment.itemCardConfig.minBidOffset,
        });

        // update bids array for historic data

        // undo item bid
        // check before update
        this.itemsRepo.getOne(item.auctionId, item.id).pipe(take(1))
          .subscribe(itemToCheck => {

            if (item.bid <= itemToCheck.bid) {
              console.log("Can not offer less then or equal bid value to current one.");
            }

            // do update
            this.bidsRepo.create(bid).then(
              createdBid => {
                // update current item bid data
                this.itemsRepo.update(item.auctionId, item.id, {
                  bidId: createdBid.id,
                  bid: bid.bid,
                  user: bid.userId,
                });
              }
            );

          })
      });
  }

  /* Undo last bid placed by THIS particular user
   * Only if last price applied is from THIS user
   * */
  onUndoBid(item: AuctionItem) {

    from(this.authSvc.login())
      .pipe(
        take(1),
        concatMap(_ => this.authSvc.user$),
        filter(user => !!user))
      .subscribe(user => {

        if (item.user != user.uid)
          return;

        let bids = [...this.bids];

        const lastBid = this.deleteLastBid(bids);

        // undo item bid
        this.itemsRepo.update(item.auctionId, item.id, {
          bid: lastBid.bid,
          user: lastBid.userId,
        });

      });
  }

  /** Deletes last bid and any bid that matches it's value (because of possible same time bids)
   *  Retrieves first deleted bid
   */
  deleteLastBid(bids) {

    const bidsToDelete: Bid[] = [];
    bidsToDelete.push(bids.splice(0, 1)[0]);

    // take next (now new last) bid
    // get last bid which isn't the same value (ignore duplicates)
    // TODO: Extract and refactor
    let lastBid = bids[0];
    if(!lastBid) {
      lastBid = new Bid({ bid: 0, userId: null });
    } else {
      while (lastBid.bid == this.item.bid) {
        bidsToDelete.push(bids.splice(0, 1)[0]);
        lastBid = bids[0];

        if (!lastBid) {
          // default state for auction item
          lastBid = new Bid({ bid: 0, userId: null });
          break;
        }
      }
    }

    for (const bidToDelete of bidsToDelete) {
      this.bidsRepo.delete(bidToDelete.id);
    }

    return lastBid;
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
