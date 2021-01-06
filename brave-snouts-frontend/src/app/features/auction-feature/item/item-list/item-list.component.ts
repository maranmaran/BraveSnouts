import { Component, Input, OnInit } from '@angular/core';
import { QueryFn, DocumentData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs/internal/Observable';
import { take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { ProgressBarService } from 'src/business/services/progress-bar.service';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
  ) { }

  // Input data and user info
  @Input('auctionId') auctionId: string;
  
  items$: Observable<AuctionItem[]>;

  ngOnInit(): void {
    
    this.items$ = this.getItems();

    // sim loading
    this.loadingSvc.active$.next(true);
    setTimeout(_ => this.loadingSvc.active$.next(false), 1000);
  }

  getItems() {
    let query: QueryFn<DocumentData> = ref => ref.orderBy("name", 'asc');
    
    return this.itemsRepo.getAll(this.auctionId, query).pipe(take(1));
  }

  ngOnDestroy(): void {
  }

}
