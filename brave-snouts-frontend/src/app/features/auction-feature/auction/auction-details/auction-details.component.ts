import { Component, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { CountdownConfig } from 'ngx-countdown';
import { Observable } from 'rxjs';
import { map, pluck, take, toArray } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { AuthService } from 'src/business/services/auth.service';
import { formatDateToHoursOnlyNgxCountdown } from 'src/business/utils/date.utils';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-auction-details',
  templateUrl: './auction-details.component.html',
  styleUrls: ['./auction-details.component.scss']
})
export class AuctionDetailsComponent implements OnInit, OnDestroy {

  constructor(
    private readonly route: ActivatedRoute,
    private readonly auctionsRepo: AuctionRepository,
    public readonly mediaObs: MediaObserver,
    private readonly authSvc: AuthService
  ) { }

  auction$: Observable<Auction>;

  private _subsink = new SubSink();

  config: CountdownConfig

  ngOnInit(): void {
    // Retrieve auction data
    let auctionId = this.route.snapshot.paramMap.get('id');
    this.auction$ = this.auctionsRepo.getOne(auctionId);

    this.setupCountdown();
  }

  /**Sets up countdown component to coundown to the end date time*/
  setupCountdown() {
    this._subsink.add(this.auction$.subscribe(auction => {
      
      const today = moment(new Date(), "DD/MM/YYYY HH:mm:ss");
      const auctionEnd = moment(auction.endDate.toDate(), "DD/MM/YYYY HH:mm:ss"); 
      const dateDiff = auctionEnd.diff(today);
      const duration = moment.duration(dateDiff);
      const leftTime = duration.asSeconds();

      this.config = { leftTime, format: "HH:mm:ss", formatDate: formatDateToHoursOnlyNgxCountdown }
    }));
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

}
