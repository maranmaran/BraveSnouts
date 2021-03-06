import firebase from 'firebase/app';
import 'firebase/firestore';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { WinnerOnAuction } from './winner.model';

export class Auction {

    constructor(data: Partial<Auction>) {
        Object.assign(this, data);
    }

    id: string;

    // auction name
    name: string;
    // basic auction description (TODO)
    description: string;
    // start date and time when the auction starts
    startDate: firebase.firestore.Timestamp;
    // end date and time when the auction finishes
    endDate: firebase.firestore.Timestamp;
    // Describes if auction was processed for winners upon ending
    processed: boolean = false;
    // Describes if auction was archived
    archived: boolean = false;
    // Describes handover details sent to winners
    handoverDetails: string[];

    // total raised money
    raisedMoney: number = 0;
    winners: WinnerOnAuction[];

    items: AuctionItem[];
}
