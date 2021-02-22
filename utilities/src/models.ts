import * as firebase from 'firebase-admin';

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

    raisedMoney: 0
    // Describes if auction was processed for winners upon ending
    processed: boolean;
    // Describes if auction was archived
    archived: boolean;
    // Handover details for auction winners
    handoverDetails: string;
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

export class Winner {
    id: string;
    auctionId: string;
    itemId: string;
    bidId: string;
    userId: string;

    userInfo: {
        id: string,
        name: string;
        email: string;
    };
    
    deliveryChoice?: 'postal' | 'handover';
    handoverOption: string;
    paymentStatus: 'paid' | 'pending' | 'notpaid';
    postalInformation?: PostalInformation;
}

export class PostalInformation {
    fullName: string;
    address: string;
    phoneNumber: string;
}

export interface FirebaseFile {
    path: string,
    type: string,
    name: string,
    url: string,
}

export class User {
    id: string;
    displayName: string;
    email: string;
    avatar: string;
    signInMethod: string;
    providerId: string;
    emailSettings: EmailSettings
}

export interface EmailSettings {
    auctionAnnouncements: boolean;
    bidUpdates: boolean;
}