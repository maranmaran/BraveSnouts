import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { addDays, format, parse } from 'date-fns';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, firstValueFrom, from, noop } from 'rxjs';
import { concatMap, finalize, first, map, mergeMap, take, tap } from 'rxjs/operators';
import { Auction } from 'src/business/models/auction.model';
import { FirebaseFile } from 'src/business/models/firebase-file.model';
import { AuthService } from 'src/business/services/auth.service';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { ImageProcessingSettings, SettingsService } from 'src/business/services/settings.service';
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

  // TODO: merge all of these into pipe, service or smth central
  private readonly breakpointObs = inject(BreakpointObserver);
  get isMobile() { return this.breakpointObs.isMatched(Breakpoints.Handset); }

  private _subsink = new SubSink();

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly storage: StorageService,
    private readonly authSvc: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly toastSvc: HotToastService,
    private readonly functionSvc: FunctionsService,
    private readonly settingsSvc: SettingsService
  ) { }

  private imgProcessingSettings: ImageProcessingSettings;
  private imageBucketPath: string;

  ngOnInit(): void {

    let auction = {
      id: uuidv4(),
      name: 'Aukcija',
      startDate: new Date(),
      endDate: addDays(new Date(), 1).getDate()
    };

    this.auctionId = auction.id;
    console.log(this.auctionId);

    // create auction form
    this.createAuctionForm(auction as unknown as Auction);

    // route back to home if use is not admin
    this._subsink.add(
      this.authSvc.isAdmin$.subscribe(
        isAdmin => isAdmin ? noop() : this.router.navigate(['/aukcije']),
        err => console.log(err)
      )
    )

    this.settingsSvc.imageProcessingSettings$
      .pipe(first())
      .subscribe(settings => {
        this.imgProcessingSettings = settings;
        this.imageBucketPath = this.getImageBucket(auction.id);
      });
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  //#region Form

  /* Creates auction form group */
  createAuctionForm(auction: Auction) {
    const startTime = format(auction.startDate.toDate(), 'HH:mm');
    const endTime = format(auction.endDate.toDate(), 'HH:mm');

    this.auction = this.formBuilder.group({
      id: [auction.id], // hidden
      name: [auction.name, [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      startDate: [auction.startDate, [Validators.required]],
      endDate: [auction.endDate, [Validators.required]],
      startTime: [startTime, [Validators.required]],
      endTime: [endTime, [Validators.required]],
      description: ['']
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

  private getImageBucket(auctionId: string) {
    // return `${this.imgProcessingSettings.compress ? 'temp' : 'auction-items'}/${auctionId}`;
    return `auction-items/${auctionId}`;
  }

  /**Upload selected files onto firebase storage*/
  async uploadFiles(event) {

    this.uploadState$.next(true);

    this._subsink.add(from(event.addedFiles).pipe(

      mergeMap((file: File) => {

        const name = `${Guid.create()}`;
        const path = `${this.imageBucketPath}/${name}`;
        const type = this.getFirebaseFileType(file.type);

        let { ref, task } = this.storage.uploadFile(file, path);

        return task.snapshotChanges().pipe(
          finalize(async () => {
            const url = await firstValueFrom(ref.getDownloadURL());
            const finalFile = <FirebaseFile>{
              name,
              type,
              path,
              // these will be modified by backend 
              // in case of compression and resize
              urlOrig: url,
              urlComp: url,
              urlThumb: url
            };

            this.files.push(finalFile)
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
      description: this.auction.value.description,
    });

    from(this.auctionRepo.set(this.auctionId, auction))
      .pipe(
        take(1),
        concatMap(() =>
          this.functionSvc
            .processAuctionImages(this.auctionId, `${this.imageBucketPath}/${this.auctionId}`)
            .pipe(
              take(1),
              this.toastSvc.observe(
                {
                  loading: 'Stvaranje aukcije..',
                  success: "Aukcija uspješno stvorena",
                  error: "Nešto je pošlo po zlu",
                }
              ))
        ),
      ).subscribe(() => this.postCreate(), err => console.log(err));
  }

  /* Post create actions
   * Navigate back to root for list of auctions once done
   */
  postCreate() {
    this.clearFiles();

    this.auctionRepo.getOne(this.auctionId)
      .pipe(
        take(1),
        tap(console.log),
        concatMap(auction => this.itemsRepo.getAll(this.auctionId).pipe(take(1), map(items => [auction, items]))),
        concatMap(([auction, items]) => this.router.navigate(
          ['/app/izmjena-aukcije'],
          { state: { auction, items, action: 'edit' } }
        ))
      ).subscribe(noop, err => console.log(err));
  }

  clearFiles() {
    if (!this.filesToDeleteQueue) return;

    for (const file of this.filesToDeleteQueue) {
      this.storage.deleteFile(file.urlOrig).catch(err => console.log(err))
    }
  }

  //#endregion
}
