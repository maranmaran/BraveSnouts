import firebase from 'firebase/app';
import { AuctionItem } from 'src/business/models/auction-item.model';

export class Auction {

    constructor(data: Partial<Auction>) {
        Object.assign(this, data);
    }

    id: string;
    name: string;
    description: string;
    startDate: firebase.firestore.Timestamp;
    endDate: firebase.firestore.Timestamp;
    items: AuctionItem[];

    // Describes if auction was processed for winners upon ending
    processed: boolean;
    // Describes if auction was archived
    archived: boolean;
}   
