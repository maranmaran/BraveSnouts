import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { addDays, format, parse } from 'date-fns';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { BehaviorSubject, forkJoin, from, noop } from 'rxjs';
import { concatMap, filter, finalize, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { FirebaseFile } from 'src/business/models/firebase-file.model';
import { AuthService } from 'src/business/services/auth.service';
import { BreakpointService } from 'src/business/services/breakpoint.service';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { StorageService } from 'src/business/services/storage.service';
import { SubSink } from 'subsink';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-auction-bulk-image-form',
  templateUrl: './auction-bulk-image-form.component.html',
  styleUrls: ['./auction-bulk-image-form.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository, FunctionsService]
})
export class AuctionBulkImageFormComponent implements OnInit {

  // form data
  auction: FormGroup;
  files: FirebaseFile[] = [];

  auctionId: string;

  // flags
  uploadState$ = new BehaviorSubject<boolean>(false);
  dragActive = false;

  readonly isMobile$ = inject(BreakpointService).isMobile$;

  private _subsink = new SubSink();

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly storage: StorageService,
    private readonly authSvc: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly toastSvc: HotToastService,
  ) { }


  ngOnInit() {

    const auction = new Auction({
      id: uuidv4(),
      name: null,
      startDate: Timestamp.fromDate(new Date()),
      endDate: Timestamp.fromDate(addDays(new Date(), 1))
    });

    this.auctionId = auction.id;

    // create auction form
    this.createAuctionForm(auction);

    // route back to home if use is not admin
    this._subsink.add(
      this.authSvc.isAdmin$
        .pipe(
          filter(isAdmin => !isAdmin),
          switchMap(() => this.router.navigate(['/aukcije'])),
        ).subscribe()
    )
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  //#region Form

  /* Creates auction form group */
  createAuctionForm(auction: Auction) {
    this.auction = this.formBuilder.group({
      id: [auction.id], // hidden
      name: [auction.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startDate: [auction.startDate.toDate(), [Validators.required]],
      endDate: [auction.endDate.toDate(), [Validators.required]],
      startTime: [format(auction.startDate.toDate(), 'HH:mm'), [Validators.required]],
      endTime: [format(auction.endDate.toDate(), 'HH:mm'), [Validators.required]],
      description: ['']
    });
  }

  /**Check if whole form is valid */
  get isValid() { return this.auction.valid }

  //#endregion

  //#region Media

  /**Delay drag active flag once drag is over to avoid click event from dropzone*/
  dragEnd() {
    setTimeout(_ => this.dragActive = false, 100);
  }

  /**Upload selected files onto firebase storage*/
  async uploadFiles(event) {
    this.uploadState$.next(true);

    this._subsink.add(
      from(event.addedFiles).pipe(
        mergeMap((file: File) => this.storage.uploadAuctionImage(this.auctionId, file, this.files)),
        finalize(() => this.uploadState$.next(false))
      ).subscribe(noop)
    )

  }

  filesToDeleteQueue: FirebaseFile[] = [];
  /**Remove file from array of files */
  removeFile(file: FirebaseFile, url: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // delete on server
    this.filesToDeleteQueue.push(file);
    this.files.splice(this.files.indexOf(file), 1);
  }

  //#endregion

  //#region Form submit

  /**Submit form and create auction */
  async onSubmit() {

    if (!this.isValid)
      return;

    const startDate = parse(
      `${format(this.auction.value.startDate, 'MM/dd/yyyy')} ${this.auction.value.startTime}`,
      'MM/dd/yyyy HH:mm',
      new Date()
    );
    const endDate = parse(
      `${format(this.auction.value.endDate, 'MM/dd/yyyy')} ${this.auction.value.endTime}`,
      'MM/dd/yyyy HH:mm',
      new Date()
    );

    const auction = new Auction({
      id: this.auctionId,
      name: this.auction.value.name,
      startDate: firebase.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.firestore.Timestamp.fromDate(endDate),
      raisedMoney: 0,
      description: this.auction.value.description
    });

    const items = this.files.map(f => <AuctionItem>({
      id: uuidv4(),
      auctionId: this.auctionId,
      name: '',
      description: '',
      media: [f],
      startBid: 0,
      bid: 0,
    }));

    // these are nested fb collections, not props
    delete auction.winners;
    delete auction.items;

    // create auction
    // create items
    // delete unused media files
    // route to auction edit page

    this._subsink.add(
      from(this.auctionRepo.set(this.auctionId, auction))
        .pipe(
          this.toastSvc.observe(this.createToast),
          concatMap(() => this.createItems(items)),
          tap(() => this.deleteUnusedFiles()),
          switchMap(() => this.navigateToAuctionEditPage(auction, items))
        )
        .subscribe(noop)
    )
  }

  private createToast = {
    loading: 'Stvaranje aukcije..',
    success: "Aukcija uspješno stvorena",
    error: "Nešto je pošlo po zlu"
  };

  deleteUnusedFiles() {
    if (!this.filesToDeleteQueue) return;

    // no await, I don't care if this gets done..
    for (const file of this.filesToDeleteQueue) {
      this.storage.deleteFile(file.original.fUrl);
    }
  }

  createItems(items: AuctionItem[]) {
    return forkJoin(
      items.map(i => this.itemsRepo.set(this.auctionId, i.id, i))
    )
  }

  navigateToAuctionEditPage(auction: Auction, items: AuctionItem[]) {
    return this.router.navigate(
      ['/aukcije/izmjena-aukcije'],
      { state: { auction, items, action: 'edit' } }
    )
  }

  //#endregion

  trackFile(_, item: FirebaseFile) {
    return item.original.fUrl;
  }
}
