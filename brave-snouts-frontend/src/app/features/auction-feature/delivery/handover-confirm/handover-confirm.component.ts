import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from } from 'rxjs';
import { take, mergeMap, map } from 'rxjs/operators';
import { Winner } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { WinnersRepository } from 'src/business/services/repositories/winners.repository';

@Component({
  selector: 'app-handover-confirm',
  templateUrl: './handover-confirm.component.html',
  styleUrls: ['./handover-confirm.component.scss'],
  providers: [AuctionItemRepository]
})
export class HandoverConfirmComponent implements OnInit {
  
  success: boolean;
  bootstrap: boolean = false;

  
  private _auctionId: string;
  private _userId: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this._auctionId = this.route.snapshot.paramMap.get('auctionId');
    this._userId = this.route.snapshot.paramMap.get('userId');

    if(!this._auctionId || !this._userId) {
      this.router.navigate(['/app']);
      return null;
    }

    this.onSubmit();
  }

  onSubmit() {

    // update winner post delivery option data
    let query = ref => ref.where('winner.userId', '==', this._userId);

    let items$ = this.itemsRepo.getAll(this._auctionId, query);

    items$.pipe(
      take(1),
      mergeMap(items => [...items]),
      map(item => item.winner),
      map(winner => [winner.itemId, Object.assign({}, winner, {deliveryChoice: 'handover'}) ]),
      mergeMap(([id, data]) => from(this.itemsRepo.getDocument(this._auctionId, id as string).update({ winner: data as Winner} )).pipe(take(1)) )
    ).subscribe(
      () => this.success = true, 
      err => (console.log(err), this.success = false),
      () => this.bootstrap = true
    );

  }

}
