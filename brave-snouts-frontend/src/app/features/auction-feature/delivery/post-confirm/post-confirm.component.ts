import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { noop, throwError } from 'rxjs';
import { catchError, map, mergeMap, take } from 'rxjs/operators';
import { Winner } from 'src/business/models/winner.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';

@Component({
  selector: 'app-post-confirm',
  templateUrl: './post-confirm.component.html',
  styleUrls: ['./post-confirm.component.scss'],
  providers: [AuctionItemRepository, FunctionsService],
})
export class PostConfirmComponent implements OnInit {

  postDeliveryInfoForm: FormGroup;

  submitted: boolean = false;
  success: boolean;
  bootstrap: boolean = false;

  private _auctionId: string;
  private _userId: string;

  public originalDonation: number;
  public totalDonation: number;
  public paymentDetail: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly functionSvc: FunctionsService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('auctionId');
    this._userId = this.route.snapshot.paramMap.get('userId');
    this.originalDonation = parseFloat(this.route.snapshot.paramMap.get('donation'));
    this.paymentDetail = this.route.snapshot.paramMap.get('paymentDetails');

    if(!this._auctionId || !this._userId || !this.originalDonation) {
      this.success = false;
      this.bootstrap = true;

      setTimeout(() => this.router.navigate(["/app"]), 10000);
      return;
    }


    this.totalDonation = this.originalDonation + 20;

    this.postDeliveryInfoForm = this.fb.group({
      fullName: this.fb.control('', Validators.required),
      address: this.fb.control('', Validators.required),
      phoneNumber: this.fb.control('', Validators.required),
    });
  }

  onSubmit() {

    this.submitted = true;

    if(!this.postDeliveryInfoForm.valid) {
      return null;
    }

    // update winner post delivery option data
    let data = this.postDeliveryInfoForm.value;

    let query = ref => ref.where('winner.userId', '==', this._userId);

    let items$ = this.itemsRepo.getAll(this._auctionId, query);

    items$.pipe(
      take(1),
      mergeMap(items => [...items]),
      map(item => item.winner),
      map(winner => [winner.itemId, Object.assign({}, winner, { postalInformation: data, deliveryChoice: 'postal' }) ]),
      mergeMap(([id, data]) => this.itemsRepo.getDocument(this._auctionId, id as string).update({ winner: data as Winner } ) ),
      catchError(err => (console.log(err), throwError(err) ) ),
    ).subscribe(
      () => this.success = true,
      err => (console.log(err), this.success = false),
      () => (this.sendConfirmation(), this.bootstrap = true)
    );

  }

  sendConfirmation() {
    this.functionSvc.sendPostConfirm(this._userId, this._auctionId, this.postDeliveryInfoForm.value, this.totalDonation, this.paymentDetail).pipe(take(1)).subscribe(noop)
  }

}
