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
    // Describes if auction was archived
    archived: boolean;
    // Handover details for auction winners
    handoverDetails: string;
}

export class Winner {

    constructor(data: Partial<Winner>) {
        Object.assign(this, data);
    }

    id: string;
    auctionId: string;
    itemId: string;
    bidId: string;
    userId: string;
    
    userInfo: {
        name: string;
        email: string;
    };

    deliveryChoice: 'postal' | 'handover' | null;
    postalInformation: PostalInformation | null;
    paymentStatus: 'paid' | 'pending' | 'notpaid';
}


export class PostalInformation {
    fullName: string;
    address: string;
    phoneNumber: string;
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

    winner: Winner;
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

export interface TrackedItem {
    auctionId: string,
    itemId: string,
    userId: string,
}