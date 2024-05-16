import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { WinnerOnAuction } from './winner.model';

export class Auction {

    constructor(data: Partial<Auction>) {
        Object.assign(this, data);
    }

    id: string = null;

    // auction name
    name: string = null;
    // basic auction description (TODO)
    description: string = null;
    // start date and time when the auction starts
    startDate: firebase.firestore.Timestamp = Timestamp.now();
    // end date and time when the auction finishes
    endDate: firebase.firestore.Timestamp = Timestamp.now();
    // Describes if auction was processed for winners upon ending
    processed: boolean = false;
    // Describes if auction was archived
    archived: boolean = false;
    // Describes handover details sent to winners
    handoverDetails: string[] = [];
    // Describes last point in time the winning mails were sent
    lastTimeWinningMailsSent?: Timestamp = null;
    // Describes how much of total mails were sent    
    howMuchWinningMailsSent?: string = 'none';

    // total raised money
    raisedMoney: number = 0;
    winners: WinnerOnAuction[] = [];

    items: AuctionItem[] = [];
}
