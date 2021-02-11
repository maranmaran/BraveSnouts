import { Injectable } from "@angular/core";
import { IPageInfo } from "ngx-virtual-scroller";
import { Subject } from "rxjs";
import { AuctionItem } from "src/business/models/auction-item.model";

@Injectable()
export class ItemDialogService {

    items = new Subject<AuctionItem[]>();

    fetchMore = new Subject<IPageInfo>();
}