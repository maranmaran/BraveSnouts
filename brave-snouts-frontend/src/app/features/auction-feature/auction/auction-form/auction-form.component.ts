import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import { Guid } from 'guid-typescript';
import * as moment from 'moment';
import { BehaviorSubject, noop } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { concatMap, finalize, map, mergeMap, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { AuthService } from 'src/business/services/auth.service';
import { FunctionsService } from 'src/business/services/functions.service';
import { SubSink } from 'subsink';
import { StorageService } from './../../../../../business/services/storage.service';

export interface FirebaseFile {
  path: string,
  type: string,
  name: string,
  compressedPath: string
}

@Component({
  selector: 'app-auction-form',
  templateUrl: './auction-form.component.html',
  styleUrls: ['./auction-form.component.scss']
})
export class AuctionFormComponent implements OnInit {

  // form data
  auction: FormGroup;
  items: FormGroup;
  files: FirebaseFile[][] = [];
  
  // flags 
  uploadStates$: BehaviorSubject<boolean>[] = [];
  dragActive = false;
  createMode= false;

  /**Check if current view is mobile phone */
  public get isMobile(): boolean {
    return this.mediaObserver.isActive('lt-sm')
  }

  private _subsink = new SubSink();
  
  constructor(
    public readonly mediaObserver: MediaObserver,
    private readonly formBuilder: FormBuilder,
    private readonly auctionRepo: AuctionRepository,
    private readonly auctionItemRepo: AuctionItemRepository,
    private readonly storage: StorageService,
    private readonly router: Router,
    private readonly authSvc: AuthService,
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
        isAdmin => isAdmin ? noop() : this.router.navigate(['/'])
      )
    )

  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  //#region Form

  /* Creates auction form group */
  createAuctionForm(auction: Auction) {
    this.auction= this.formBuilder.group({
      id: [auction.id], // hidden
      name: [auction.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startDate: [auction.startDate, [Validators.required]],
      endDate: [auction.endDate, [Validators.required]],
    });
  }

  /* Creates item controls array and prepares upload input */
  createItemsForm(items: AuctionItem[]) {

    let itemControls = [];
    if(items.length == 0) {
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
      id: [item?.id],
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

  /**Removes item group from array*/
  removeItem(index) {
    let items = (this.itemsArr as FormArray);
    items.removeAt(index);
    this.files.splice(index, 1);
    this.uploadStates$.splice(index, 1);
  }
  
  /**Check if whole form is valid */
  public get isValid()  {
    return this.auction.valid && this.items.valid 
  }

  trackByFn(index, item) {
    return index;
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

    from(event.addedFiles)
    .pipe(
      mergeMap((file: File) => {

        const name = `${Guid.create()}.jpg`;
        const path = `auction-items/${name}`;
        const type = this.getFirebaseFileType(file.type);

        return from(this.storage.uploadFile(file, path))
        .pipe(
          map(_ => ({ name, type, path }) as FirebaseFile),
          tap((firebaseFile: FirebaseFile) => this.files[index].push(firebaseFile))
        )
      }),
      // tap(res => console.log(res)),
      finalize(() => this.uploadStates$[index].next(false))
    ).subscribe(noop)
      
  }

  /**Check file type */
  getFirebaseFileType(type): 'file' | 'image' | 'video' {
    if(type.indexOf('image') != -1) 
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
    .then(() => this.files[itemIdx].splice(this.files[itemIdx].indexOf(file), 1))
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

    console.log("submitting");
    
    if(!this.isValid)
      return;

    const startDate = moment(this.auction.value.startDate).utc().toDate();
    const endDate = moment(this.auction.value.endDate).utc().toDate();

    const auction = new Auction({
      name: this.auction.value.name,
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      // description: this.auction.value.description,
    });

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
          bid: item.bid ?? item.startPrice, // default to start price if none defined
          user: item.user ?? null,
          bidId: item.bidId ?? null,
      }));

    if(this.createMode) {
      this.onCreate(auction, items);
    } else {
      this.onUpdate(auction, items);
    }
  }

  onCreate(auction: Auction, items: AuctionItem[]) {
    from(this.auctionRepo.create(auction))
    .pipe(
      concatMap(auction => from(this.auctionItemRepo.writeBatch(auction.id, items)))
    ).subscribe(
      _ => this.postCreate()
    )
  }

  onUpdate(auction: Auction, items: AuctionItem[]) {
    let auctionRefId = this.auction.value.id as string;
    let itemRefIds = this.itemsArr.value.map(item => item.id) as string[];

    items = items.map((item, index) => Object.assign(item, {id: itemRefIds[index]}));

    // do update
    from(this.auctionRepo.update(auctionRefId, Object.assign({}, auction)))
    .pipe(
      concatMap(_ => from(this.auctionItemRepo.writeBatch(auctionRefId, items)))
    ).subscribe(
      _ => this.postUpdate()
    )

  }

  /* Post create actions
   * Navigate back to root for list of auctions once done
   */
  postCreate() {
    this.router.navigate(['']);
  }

  /* Post update actions
   * ...
   */
  postUpdate() {
    this.router.navigate(['']);
  }


  //#endregion

}
