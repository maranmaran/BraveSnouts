import { FirebaseFile } from "src/business/models/firebase-file.model";
import { Winner } from "src/business/models/winner.model";

export class AuctionItem {

    constructor(data: Partial<AuctionItem>) {
        Object.assign(this, data);
    }

    id: string = null;
    auctionId: string = null;
    name: string = null;
    description: string = null;
    media: FirebaseFile[] = [];

    startBid: number = 0;

    // user bid data
    bidId: string = null;
    bid: number = 0;
    user: string = null;

    winner: Winner = null;
}
