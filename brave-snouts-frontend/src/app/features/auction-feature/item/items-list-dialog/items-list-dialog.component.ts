import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { SingleItemDialogComponent } from 'src/app/features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { SubSink } from 'subsink';
import { IPageInfo } from 'ngx-virtual-scroller';

@Component({
  selector: 'app-items-list-dialog',
  templateUrl: './items-list-dialog.component.html',
  styleUrls: ['./items-list-dialog.component.scss']
})
export class ItemsListDialogComponent implements OnInit {

  items$: BehaviorSubject<AuctionItem[]>;

  private readonly _subsink = new SubSink();

  constructor(
    private readonly dialog: MatDialogRef<ItemsListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { items: AuctionItem[], initItem: AuctionItem, svc: ItemDialogService } = null
  ) { }

  ngOnInit(): void {

    this.items$ = new BehaviorSubject(this.data.items);

    this._subsink.add(
      this.onItemsChange()
    )

  }

  onClose() {
    this.dialog.close();
  }

  onItemsChange() {
    return this.data.svc.items.subscribe(items => {
      this.items$.next(items);
    });
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

  onFetchMore(event: IPageInfo) {
    this.data.svc.fetchMore.next(event);
  }
}
