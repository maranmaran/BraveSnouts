import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, mergeMap, take } from 'rxjs/operators';
import { Winner } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { WinnersRepository } from 'src/business/services/repositories/winners.repository';

@Component({
  selector: 'app-post-confirm',
  templateUrl: './post-confirm.component.html',
  styleUrls: ['./post-confirm.component.scss'],
  providers: [AuctionItemRepository]
})
export class PostConfirmComponent implements OnInit {

  postDeliveryInfoForm: FormGroup;

  success = false;

  private _auctionId: string;
  private _userId: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('auctionId');
    this._userId = this.route.snapshot.paramMap.get('userId');

    if(!this._auctionId || !this._userId) {
      this.router.navigate(['/']);
      return null;
    }

    this.postDeliveryInfoForm = this.fb.group({
      fullName: this.fb.control('', Validators.required),
      address: this.fb.control('', Validators.required),
      phoneNumber: this.fb.control('', Validators.required),
    });
  }

  onSubmit() {

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
      mergeMap(([id, data]) => this.itemsRepo.getDocument(this._auctionId, id as string).update({ winner: data as Winner } ))
    ).subscribe(
      () => this.success = true, 
      // () => this.router.navigate(['/']), 
      err => console.log(err)
    );

  }

}
