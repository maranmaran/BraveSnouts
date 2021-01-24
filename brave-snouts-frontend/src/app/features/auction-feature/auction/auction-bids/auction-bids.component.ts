import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { CountdownConfig } from 'ngx-countdown';
import { noop, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { PostDetailsComponent } from 'src/app/features/auction-feature/delivery/post-details/post-details.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { Winner } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { BidsRepository } from 'src/business/services/bids.repository';
import { FunctionsService } from 'src/business/services/functions.service';
import { WinnersRepository } from 'src/business/services/winners.repository';
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
    private readonly winnersRepo: WinnersRepository,
    private readonly route: ActivatedRoute,
    public readonly mediaObs: MediaObserver,
    private readonly functionsSvc: FunctionsService,
    private readonly dialog: MatDialog,
  ) { }

  auction$: Observable<Auction>;
  items$: Observable<AuctionItem[]>;
  winners: Map<string, Winner>;

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
    this.getWinners(auctionId); 


    this.setupCountdown();
  }

  /** Gets auction winners and groups them by items for rendering */
  getWinners(auctionId: string) {
    let winners$ = this.winnersRepo.getAll(ref => ref.where('auctionId', '==', auctionId));

    let winnersMap$ = winners$.pipe(
      map(winners => winners.map(winner => [winner.itemId, winner] as [string, Winner] )),
      map(winners => new Map<string, Winner>(winners)),
    )

    this._subsink.add(
      winnersMap$.subscribe(winnersMap => this.winners = winnersMap)
    );
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

  closeAuction(auctionId) {
    this.functionsSvc.endAuction(auctionId)
    // TODO
    .subscribe(res => console.log(res), err => console.log(err));
  }

  openPostalInformation(data) {
    
    const dialogRef = this.dialog.open(PostDetailsComponent, {
      height: 'auto',
      width: 'auto',
      maxWidth: '98%',
      autoFocus: false,
      closeOnNavigation: true,
      data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(noop)

  }

}
