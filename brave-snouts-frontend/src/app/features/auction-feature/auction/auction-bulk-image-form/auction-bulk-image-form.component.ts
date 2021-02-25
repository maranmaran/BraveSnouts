import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import * as firebase from 'firebase';
import { Guid } from 'guid-typescript';
import * as moment from 'moment';
import { BehaviorSubject, from, noop } from 'rxjs';
import { concatMap, finalize, mergeMap, take } from 'rxjs/operators';
import { Auction } from 'src/business/models/auction.model';
import { FirebaseFile } from 'src/business/models/firebase-file.model';
import { AuthService } from 'src/business/services/auth.service';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { StorageService } from 'src/business/services/storage.service';
import { SubSink } from 'subsink';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-auction-bulk-image-form',
  templateUrl: './auction-bulk-image-form.component.html',
  styleUrls: ['./auction-bulk-image-form.component.scss'],
  providers: [AuctionRepository, FunctionsService]
})
export class AuctionBulkImageFormComponent implements OnInit {

  // form data
  auction: FormGroup;
  files: FirebaseFile[] = [];

  auctionId: string = uuidv4();

  // flags
  uploadState$ = new BehaviorSubject<boolean>(false);
  dragActive = false;

  /**Check if current view is mobile phone */
  public get isMobile(): boolean {
    return this.mediaObserver.isActive('lt-sm')
  }

  private _subsink = new SubSink();

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly storage: StorageService,
    private readonly authSvc: AuthService,
    public readonly mediaObserver: MediaObserver,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly toastSvc: HotToastService,
    private readonly functionSvc: FunctionsService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    let auction = {
      name: 'Aukcija',
      startDate: new Date(),
      endDate: moment(new Date()).add(1, 'day').toDate()
    };

    // create auction form
    this.createAuctionForm(auction as unknown as Auction);

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
      id: [auction.id], // hidden
      name: [auction.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startDate: [auction.startDate, [Validators.required]],
      endDate: [auction.endDate, [Validators.required]],
      startTime: [startTime, [Validators.required]],
      endTime: [endTime, [Validators.required]],
      description: ['Opis aukcije..']
    });
  }

  /**Check if whole form is valid */
  public get isValid() {
    return this.auction.valid
  }

  //#endregion

  //#region Media

  /**Delay drag active flag once drag is over to avoid click event from dropzone*/
  dragEnd() {
    setTimeout(_ => this.dragActive = false, 100);
  }

  /**Upload selected files onto firebase storage*/
  async uploadFiles(event) {

    this.uploadState$.next(true);


    this._subsink.add(from(event.addedFiles).pipe(

      mergeMap((file: File) => {

        const name = `${Guid.create()}`;
        const path = `temp/${this.auctionId}/${name}`;
        const type = this.getFirebaseFileType(file.type);

        let { ref, task } = this.storage.uploadFile(file, path);

        return task.snapshotChanges().pipe(
          finalize(async () => {
            let url = await ref.getDownloadURL().toPromise();
            this.files.push({ name, type, path, url } as FirebaseFile)
            this.changeDetectorRef.detectChanges();
          }));
      }),

      finalize(() => this.uploadState$.next(false))
    )
    .subscribe(noop, err => console.log(err)))

  }

  /**Check file type */
  getFirebaseFileType(type): 'file' | 'image' | 'video' {
    if (type.indexOf('image') != -1)
      return 'image';

    return 'video';
  }

  /**Remove file from array of files */
  removeFile(file: FirebaseFile, url: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // this.files[itemIdx].splice(this.files[itemIdx].indexOf(file), 1);

    // delete on server
    this.uploadState$.next(true);
    this.storage.deleteFile(url)
      .then(() => this.files.splice(this.files.indexOf(file), 1))
      .catch(err => console.log(err))
      .finally(() => {
        // delete locally
        this.files.splice(this.files.indexOf(file), 1);
        this.uploadState$.next(false);
      });

  }

  //#endregion

  //#region Form submit

  /**Submit form and create auction */
  async onSubmit() {

    if (!this.isValid)
      return;

    const startDate = moment(moment(this.auction.value.startDate).format('L') + ' ' + this.auction.value.startTime, 'L HH:mm').toDate();
    const endDate = moment(moment(this.auction.value.endDate).format('L') + ' ' + this.auction.value.endTime, 'L HH:mm').toDate();

    const auction = new Auction({
      id: this.auctionId,
      name: this.auction.value.name,
      startDate: firebase.default.firestore.Timestamp.fromDate(startDate),
      endDate: firebase.default.firestore.Timestamp.fromDate(endDate),
      raisedMoney: 0,
      description: this.auction.value.description,
    });

    from(this.auctionRepo.set(this.auctionId, auction))
      .pipe(
        take(1),
        this.toastSvc.observe(
          {
            loading: 'Stvaranje aukcije..',
            success: "Aukcija uspješno stvorena",
            error: "Nešto je pošlo po zlu",
          }
        ),
        concatMap(() => this.functionSvc.processAuctionImages(this.auctionId, `temp/${this.auctionId}`))
      ).subscribe(this.postCreate, err => console.log(err));
  }

  /* Post create actions
   * Navigate back to root for list of auctions once done
   */
  postCreate() {
    this.router.navigate(['/app']);
  }

  //#endregion
}
