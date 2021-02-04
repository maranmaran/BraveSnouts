import { FirebaseFile } from "src/business/models/firebase-file.model";
import { Winner } from "src/business/models/winner.model";

export class AuctionItem {

    constructor(data: Partial<AuctionItem>) {
        Object.assign(this, data);
    }

    id: string;
    auctionId: string;
    name: string;
    description: string;
    media: FirebaseFile[];

    startBid: number = 0;

    // user bid data
    bidId: string;
    bid: number = 0;
    user: string;

    winner: Winner;
}
