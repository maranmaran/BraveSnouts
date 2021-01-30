import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss'],
  providers: [AuctionItemRepository]
})
export class SingleItemComponent implements OnInit, OnDestroy {

  item$: BehaviorSubject<any>;

  private readonly _subsink = new SubSink();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly itemRepo: AuctionItemRepository,
    @Inject(MAT_DIALOG_DATA) public data: { item: AuctionItem, svc: ItemDialogService }
  ) { }

  ngOnInit(): void {

    const isDialog = this.data && this.data.item;

    if(!isDialog) {

      const auctionId = this.route.snapshot.paramMap.get('auctionId');
      const itemId = this.route.snapshot.paramMap.get('itemId');
  
      if(!auctionId || !itemId) {
        this.router.navigate(['/']);
      } else {
        this.item$ = new BehaviorSubject(this.itemRepo.getOne(auctionId, itemId));
      } 
    
    } else {

      this.item$ = new BehaviorSubject(this.data.item);

      this._subsink.add(
        this.onItemsChange()
      )

    }

  }

  onItemsChange() {

    return this.data.svc.items.subscribe(items => {

      let idx = items.findIndex(i => i.id == this.data.item.id);
      if(idx == -1) return;

      this.item$.next(items[idx]);
    });
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

}
