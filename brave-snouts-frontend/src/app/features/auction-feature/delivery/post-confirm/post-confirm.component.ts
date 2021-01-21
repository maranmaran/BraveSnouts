import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { noop } from 'rxjs';
import { map, mergeMap, switchMap, take } from 'rxjs/operators';
import { Winner } from 'src/business/models/winner.model';
import { WinnersRepository } from 'src/business/services/winners.repository';

@Component({
  selector: 'app-post-confirm',
  templateUrl: './post-confirm.component.html',
  styleUrls: ['./post-confirm.component.scss']
})
export class PostConfirmComponent implements OnInit {

  postDeliveryInfoForm: FormGroup;

  private _auctionId: string;
  private _userId: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly winnersRepo: WinnersRepository,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    console.log(this.route);
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

    let query = ref => ref.where('auctionId', '==', this._auctionId)
                          .where('userId', '==', this._userId);

    let winners$ = this.winnersRepo.getAll(query);

    winners$.pipe(
      take(1),
      mergeMap(winners => [...winners]),
      map(winner => [winner.id, { postalInformation: data, deliveryChoice: 'postal' } as Partial<Winner>]),
      mergeMap(([id, data]) => this.winnersRepo.getDocument(id as string).update(data as Partial<Winner>))
    ).subscribe(
      // TODO: Toast notification for successful submit
      () => this.router.navigate(['/']), 
      err => console.log(err)
    );

  }

}
