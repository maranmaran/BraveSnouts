import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { AuctionItem } from "src/business/models/auction-item.model";

@Injectable()
export class ItemDialogService {

    items = new Subject<AuctionItem[]>();
}