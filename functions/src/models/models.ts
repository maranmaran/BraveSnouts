import * as firebase from 'firebase-admin';

export interface FirebaseFile {
    path: string,
    type: string,
    name: string
}

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
}

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
}

export interface Bid {
    value: number;
    user: string;
    item: AuctionItem; 
}

export interface UserInfo {
    id: string;
    name: string;
    email: string;
}