import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { noop } from 'rxjs';
import { map, mergeMap, startWith, take, tap } from 'rxjs/operators';
import { Winner, WinnerOnAuction } from 'src/business/models/winner.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SettingsService } from 'src/business/services/settings.service';
import { WinnersRepository } from './../../../../../business/services/repositories/winners.repository';

export interface PostConfirmFormData {
  fullName: string;
  city: string;
  address: string;
  zipNumber: string;
  phoneNumber: string;
}

export interface PostConfirmForm {
  fullName: FormControl<string>;
  city: FormControl<string>;
  address: FormControl<string>;
  zipNumber: FormControl<string>;
  phoneNumber: FormControl<string>;
}

@Component({
  selector: 'app-post-confirm',
  templateUrl: './post-confirm.component.html',
  styleUrls: ['./post-confirm.component.scss'],
  providers: [AuctionItemRepository, FunctionsService, WinnersRepository],
  encapsulation: ViewEncapsulation.None,
})
export class PostConfirmComponent implements OnInit {

  postDeliveryInfoForm: FormGroup<PostConfirmForm>;

  submitted: boolean = false;
  success: boolean;
  bootstrap: boolean = false;

  private _auctionIds: string[];
  private _userId: string;

  public postageFee: number;
  public originalDonation: number;
  public totalDonation: number; // with addition postal send price (3€)
  public paymentDetail: string;

  settings$ = this.settingsSvc.getMailVariables().pipe(startWith({}));

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly winnerRepo: WinnersRepository,
    private readonly functionSvc: FunctionsService,
    private readonly router: Router,
    private readonly settingsSvc: SettingsService
  ) { }

  ngOnInit(): void {
    this._auctionIds = this.route.snapshot.paramMap.get('auctionIds').split(',');
    this._userId = this.route.snapshot.paramMap.get('userId');
    this.originalDonation = parseFloat(this.route.snapshot.paramMap.get('donation'));
    this.postageFee = parseFloat(this.route.snapshot.paramMap.get('postageFee'));
    this.paymentDetail = this.route.snapshot.paramMap.get('paymentDetails');

    if (!this._auctionIds || !this._userId || !this.originalDonation) {
      this.success = false;
      this.bootstrap = true;

      setTimeout(() => this.router.navigate(["/app"]), 10000);
      return;
    }


    this.totalDonation = this.originalDonation + this.postageFee;

    this.postDeliveryInfoForm = this.fb.group<PostConfirmForm>({
      fullName: this.fb.control('', Validators.required),
      city: this.fb.control('', Validators.required),
      address: this.fb.control('', Validators.required),
      zipNumber: this.fb.control('', Validators.required),
      phoneNumber: this.fb.control('', Validators.required),
    });
  }

  onSubmit() {

    this.submitted = true;

    if (!this.postDeliveryInfoForm.valid) {
      return null;
    }

    // update winner post delivery option data
    let form = this.postDeliveryInfoForm.value;
    let data = {
      fullName: form.fullName,
      address: `${form.address}, ${form.city}, ${form.zipNumber}`,
      phoneNumber: this.postDeliveryInfoForm.value.phoneNumber,
    }

    let query = ref => ref.where('winner.userId', '==', this._userId);

    let updateJobs = [];
    for (const auctionId of this._auctionIds) {
      let items$ = this.itemsRepo.getAll(auctionId, query);

      let updateJob = items$.pipe(
        take(1),
        mergeMap(items => [...items]),
        map(item => item.winner),
        tap(async winner => {

          let winnerOnAuction = new WinnerOnAuction({
            id: winner.userId,
            auctionId: winner.auctionId,
            deliveryChoice: 'postal',
            postalInformation: data
          });

          await this.winnerRepo.setAuctionWinner(winner.auctionId, winnerOnAuction);
        }),
        map((winner: Winner) => [winner.itemId, Object.assign({}, winner, { postalInformation: data, deliveryChoice: 'postal' })]),
        mergeMap(([id, data]) => this.itemsRepo.getDocument(auctionId, id as string).update({ winner: data as Winner })),
      );

      updateJobs.push(updateJob.toPromise());
    }

    Promise.all(updateJobs)
      .then(() => (this.sendConfirmation(), this.success = true))
      .catch(err => (console.error(err), this.success = false))
      .finally(() => this.bootstrap = true);
  }

  sendConfirmation() {
    this.functionSvc.sendPostConfirm(
      this._userId,
      this._auctionIds,
      this.postDeliveryInfoForm.getRawValue(),
      this.originalDonation,
      this.paymentDetail,
      this.postageFee)
      .pipe(take(1)).subscribe(noop)
  }

}
