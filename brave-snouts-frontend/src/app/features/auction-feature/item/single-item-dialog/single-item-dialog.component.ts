import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-single-item-dialog',
  templateUrl: './single-item-dialog.component.html',
  styleUrls: ['./single-item-dialog.component.scss'],
})
export class SingleItemDialogComponent implements OnInit {

  item$: BehaviorSubject<any>;

  private readonly _subsink = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { item: AuctionItem, svc: ItemDialogService } = null
  ) { }

  ngOnInit(): void {

    this.item$ = new BehaviorSubject(this.data.item);

    this._subsink.add(
      this.onItemsChange()
    )

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
