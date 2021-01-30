import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss'],
  providers: [AuctionItemRepository]
})
export class SingleItemComponent implements OnInit {

  item$: Observable<AuctionItem>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly itemRepo: AuctionItemRepository
  ) { }

  ngOnInit(): void {
    const auctionId = this.route.snapshot.paramMap.get('auctionId');
    const itemId = this.route.snapshot.paramMap.get('itemId');

    if(!auctionId || !itemId) {
      this.router.navigate(['/']);
    } else {
      this.item$ = this.itemRepo.getOne(auctionId, itemId);
    } 
  }

}
