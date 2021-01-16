import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { CountdownConfig } from 'ngx-countdown';
import { UserInfo } from 'os';
import { Observable } from 'rxjs/internal/Observable';
import { take } from 'rxjs/internal/operators/take';
import { reduce, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { AuthService } from 'src/business/services/auth.service';
import { BidsRepository } from 'src/business/services/bids.repository';
import { formatDateToHoursOnlyNgxCountdown } from 'src/business/utils/date.utils';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-auction-bids',
  templateUrl: './auction-bids.component.html',
  styleUrls: ['./auction-bids.component.scss']
})
export class AuctionBidsComponent implements OnInit {

  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly itemRepo: AuctionItemRepository,
    private readonly bidRepo: BidsRepository,
    private readonly route: ActivatedRoute,
    public readonly mediaObs: MediaObserver
  ) { }

  auction$: Observable<Auction>;
  items$: Observable<AuctionItem[]>;

  activeItemId: string;

  users = new Map<string, any>();
  bids$: Observable<Bid[]>;

  state: 'future' | 'active' | 'expired';
  config: CountdownConfig

  private _subsink = new SubSink();
  
  ngOnInit(): void {
    let auctionId = this.route.snapshot.paramMap.get('id');
    this.state = this.route.snapshot.paramMap.get('state') as 'future' | 'active' | 'expired';

    this.auction$ = this.auctionRepo.getOne(auctionId);
    this.items$ = this.itemRepo.getAll(auctionId);


    this.setupCountdown();
  }

  getBids(itemId: string) {
    this.activeItemId = itemId;
    
    const query = ref => ref.where('itemId', '==', itemId).orderBy("date", "desc");
    this.bids$ = this.bidRepo.getAll(query);
  }


  /**Sets up countdown component to coundown to the end date time*/
  setupCountdown() {
    this._subsink.add(this.auction$.subscribe(auction => {
      
      const today = moment(new Date(), "DD/MM/YYYY HH:mm:ss");
      const auctionEnd = moment(auction.endDate.toDate(), "DD/MM/YYYY HH:mm:ss"); 
      const dateDiff = auctionEnd.diff(today);
      const duration = moment.duration(dateDiff);
      const leftTime = duration.asSeconds();

      this.config = { leftTime, format: "HHh mmm sss", formatDate: formatDateToHoursOnlyNgxCountdown }
    }));
  }

}
