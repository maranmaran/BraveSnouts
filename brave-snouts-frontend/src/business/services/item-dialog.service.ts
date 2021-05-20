import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IPageInfo } from 'src/app/shared/virtual-scroll/virtual-scroller';
import { AuctionItem } from 'src/business/models/auction-item.model';

@Injectable()
export class ItemDialogService {
  items = new Subject<AuctionItem[]>();

  fetchMore = new Subject<IPageInfo>();
}
