import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { Guid } from 'guid-typescript';
import * as moment from 'moment';
import { BehaviorSubject, from, noop } from 'rxjs';
import { concatMap, finalize, mergeMap, take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { AuthService } from 'src/business/services/auth.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { SubSink } from 'subsink';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseFile } from '../../../../../business/models/firebase-file.model';
import { StorageService } from './../../../../../business/services/storage.service';

@Component({
  selector: 'app-auction-form',
  templateUrl: './auction-form.component.html',
  styleUrls: ['./auction-form.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository]
})
export class AuctionFormComponent implements OnInit, OnDestroy {

  // form data
  auction: FormGroup;
  items: FormGroup;
  files: FirebaseFile[][] = [];

  // flags
  uploadStates$: BehaviorSubject<boolean>[] = [];
  dragActive = false;
  createMode = false;

  /**Check if current view is mobile phone */
  public get isMobile(): boolean {
    return this.mediaObserver.isActive('lt-sm')
  }

  private _subsink = new SubSink();

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly auctionItemRepo: AuctionItemRepository,
    private readonly storage: StorageService,
    private readonly authSvc: AuthService,
    public readonly mediaObserver: MediaObserver,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {

    // get form data.. create or edit
    const formData = history.state;

    // determine if it's create or edit
    this.createMode = formData.action == 'create';

    // create auction form
    this.createAuctionForm(formData.auction);

    // create item form
    this.createItemsForm(formData.items);

    // route back to home if use is not admin
    this._subsink.add(
      this.authSvc.isAdmin$.subscribe(
        isAdmin => isAdmin ? noop() : this.router.navigate(['/app']),
        err => console.log(err)
      )
    )

  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  //#region Form

  /* Creates auction form group */
  createAuctionForm(auction: Auction) {
    const startTime = moment(auction.startDate).format('HH:mm');
    const endTime = moment(auction.endDate).format('HH:mm');

    this.auction = this.formBuilder.group({
      id: [auction.id ?? uuidv4()], // hidden
      name: [auction.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startDate: [auction.startDate, [Validators.required]],
      endDate: [auction.endDate, [Validators.required]],
      startTime: [startTime, [Validators.required]],
      endTime: [endTime, [Validators.required]],
      raisedMoney: [auction.raisedMoney]
    });
  }

  /* Creates item controls array and prepares upload input */
  createItemsForm(items: AuctionItem[]) {

    let itemControls = [];
    if (items.length == 0) {
      itemControls = [this.getItemFormGroup()]; // create
    } else {
      itemControls = items.map(item => this.getItemFormGroup(item)); // edit
    }

    // group all item controls
    this.items = this.formBuilder.group({ items: this.formBuilder.array(itemControls, [Validators.required]) });

    // create all file arrays and loading state for each item
    this.itemsArr.controls.forEach((_, index) => {
      let media = items[index]?.media ?? [];
      this.files.push(media);
      this.uploadStates$.push(new BehaviorSubject(false));
    });
  }

  /**Retrieves array of item control groups*/
  public get itemsArr() {
    return (this.items.get('items') as FormArray)
  }

  /**Gets new item control group */
  getItemFormGroup(item?: AuctionItem) {
    return this.formBuilder.group({

      // changeable stuff
      id: [item?.id ?? this.auctionItemRepo.getId()],
      name: [item?.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startPrice: [item?.startBid ?? 0, [Validators.min(0)]],
      description: [item?.description],

      //hidden stuff, potentially from already existing items (on update)
      auctionId: [item?.auctionId],
      bid: [item?.bid],
      user: [item?.user],
      bidId: [item?.bidId],
    });
  }

  /**Adds item control group to array */
  addItem() {
    let itemForm = this.getItemFormGroup();
    (this.itemsArr as FormArray).push(itemForm);
    this.files.push([]);
    this.uploadStates$.push(new BehaviorSubject(false))
  }

  itemsToDeleteQueue: { itemId: string, auctionId: string, user: string, bid: number }[] = [];
  /**Removes item group from array*/
  removeItem(index) {
    let items = (this.itemsArr as FormArray);
    const item = this.itemsArr.controls[index];
    items.removeAt(index);
    this.files.splice(index, 1);
    this.uploadStates$.splice(index, 1);

    if(!this.createMode) {
      this.itemsToDeleteQueue.push({ itemId: item.value.id, user: item.value.user, auctionId: this.auction.value.id, bid: item.value.bid });
    }
  }

  /**Check if whole form is valid */
  public get isValid() {
    return this.auction.valid && this.items.valid
  }

  trackByFn(_, item) {
    return item.id;
  }

  //#endregion

  //#region Media

  /**Delay drag active flag once drag is over to avoid click event from dropzone*/
  dragEnd() {
    setTimeout(_ => this.dragActive = false, 100);
  }

  /**Upload selected files onto firebase storage*/
  uploadFiles(event, index) {

    this.uploadStates$[index].next(true);

    this._subsink.add(
      from(event.addedFiles)
        .pipe(
          mergeMap(async (file: File) => {

            const name = `${Guid.create()}`;
            const path = `auction-items/${this.auction.value.id}/${name}`;
            const type = this.getFirebaseFileType(file.type);

            let {ref, task} = this.storage.uploadFile(file, path);
            await task;
            let url = await ref.getDownloadURL().pipe(take(1)).toPromise();

            let finalFile = { name, type, path, url } as FirebaseFile;
            this.files[index].push(finalFile);
          }),
          // tap(res => console.log(res)),
          finalize(() => this.uploadStates$[index].next(false))
        ).subscribe(noop, err => console.log(err))
    )
  }

  /**Check file type */
  getFirebaseFileType(type): 'file' | 'image' | 'video' {
    if (type.indexOf('image') != -1)
      return 'image';

    return 'video';
  }

  /**Remove file from array of files */
  removeFile(itemIdx: number, file: FirebaseFile, url: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // this.files[itemIdx].splice(this.files[itemIdx].indexOf(file), 1);

    // delete on server
    this.uploadStates$.push(new BehaviorSubject(true));
    this.storage.deleteFile(url)
      // .then(() => this.files[itemIdx].splice(this.files[itemIdx].indexOf(file), 1))
      .catch(err => console.log(err))
      .finally(() => {
        // delete locally
        this.files[itemIdx].splice(this.files[itemIdx].indexOf(file), 1);
        this.uploadStates$.push(new BehaviorSubject(false));
      });

  }

  //#endregion

  //#region Form submit

  /**Submit form and create auction */
  onSubmit() {


    if (!this.isValid)
      return;

    const startDate = moment(moment(this.auction.value.startDate).format('L') + ' ' + this.auction.value.startTime, 'L HH:mm').toDate();
    const endDate = moment(moment(this.auction.value.endDate).format('L') + ' ' + this.auction.value.endTime, 'L HH:mm').toDate();

    const auction = new Auction({
      name: this.auction.value.name,
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      // description: this.auction.value.description,
    });
    if(!this.createMode) {
      // to keep before state
      delete auction.processed;
      delete auction.raisedMoney;
      delete auction.archived;
    }

    const items = this.itemsArr.value.map(
      (item, index) => new AuctionItem({
        // actually editable in form
        name: item.name,
        description: item.description,
        startBid: item.startPrice,
        media: this.files[index],

        // not editable in form and might be from already existing item
        // ?? null because .set in writeBatch can't set "undefined" values
        auctionId: item.auctionId ?? null,
        bid: !item.user ? item.startPrice : item.bid, // default to start price if none defined
        user: item.user ?? null,
        bidId: item.bidId ?? null,
      }));

    if (this.createMode) {
      this.onCreate(auction, items);
    } else {
      this.onUpdate(auction, items);
    }
  }

  onCreate(auction: Auction, items: AuctionItem[]) {
    this._subsink.add(
      from(this.auctionRepo.create(auction))
        .pipe(
          concatMap(auction => from(this.auctionItemRepo.writeBatch(auction.id, items)))
        ).subscribe(
          _ => this.postCreate(),
          err => console.log(err)
        ))
  }

  onUpdate(auction: Auction, items: AuctionItem[]) {
    let auctionRefId = this.auction.value.id as string;
    let itemRefIds = this.itemsArr.value.map(item => item.id) as string[];

    items = items.map((item, index) => Object.assign(item, { id: itemRefIds[index] }));

    // do update
    this._subsink.add(
      from(this.auctionRepo.set(auctionRefId, Object.assign({}, auction)))
        .pipe(
          concatMap(_ => from(this.auctionItemRepo.writeBatch(auctionRefId, items))),
        ).subscribe(
          _ => this.postUpdate(),
          err => console.log(err)
        )
    )

    let raisedMoneyToSubtract = 0;
    for(const item of this.itemsToDeleteQueue) {
      from(this.auctionItemRepo.delete(item.auctionId, item.itemId))
      .pipe(take(1)).subscribe(noop);

      if(item.user) {
        raisedMoneyToSubtract += item.bid;
      }
    }

    if(raisedMoneyToSubtract > 0) {
      from(this.auctionRepo.update(this.auction.value.id, { raisedMoney: this.auction.value.raisedMoney - raisedMoneyToSubtract }))
      .pipe(take(1)).subscribe(noop);
    }

  }

  /* Post create actions
   * Navigate back to root for list of auctions once done
   */
  postCreate() {
    this.router.navigate(['/app']);
  }

  /* Post update actions
   * ...
   */
  postUpdate() {
    this.router.navigate(['/app']);
  }


  //#endregion

}
