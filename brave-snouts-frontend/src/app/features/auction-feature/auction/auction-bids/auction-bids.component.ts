import { Component, OnInit } from '@angular/core';
import { QueryFn } from '@angular/fire/firestore';
import { MediaObserver } from '@angular/flex-layout';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { Auction } from 'src/business/models/auction.model';
import { Bid } from 'src/business/models/bid.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { AuctionRepository } from 'src/business/services/auction.repository';
import { BidsRepository } from 'src/business/services/bids.repository';
import firebase from 'firebase/app'

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
    private readonly mediaObs: MediaObserver,
    private readonly route: ActivatedRoute
  ) { }

  auction$: Observable<Auction>;
  items$: Observable<AuctionItem[]>;
  bids$: Observable<Bid[]>;

  ngOnInit(): void {
    let auctionId = this.route.snapshot.paramMap.get('id');

    this.auction$ = this.auctionRepo.getOne(auctionId);
    this.items$ = this.itemRepo.getAll(auctionId);
  }

  getBids(itemId: string) {
    const query = ref => ref.where('itemId', '==', itemId);
    this.bids$ = this.bidRepo.getAll(query);
  }

}
