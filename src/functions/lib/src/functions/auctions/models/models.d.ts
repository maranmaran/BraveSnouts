import * as admin from 'firebase-admin';
export interface FirebaseFile {
    name: string;
    type: 'image' | 'video';
    path: string;
    urlOrig: string;
    urlComp?: string;
    urlThumb?: string;
}
export declare class Auction {
    constructor(data: Partial<Auction>);
    id: string;
    name: string;
    description: string;
    startDate: admin.firestore.Timestamp;
    endDate: admin.firestore.Timestamp;
    items: AuctionItem[];
    raisedMoney: number;
    processed: boolean;
    archived: boolean;
    handoverDetails: string[];
    lastTimeWinningMailsSent?: Date;
}
export declare class Winner {
    constructor(data: Partial<Winner>);
    id: string;
    auctionId: string;
    itemId: string;
    bidId: string;
    userId: string;
    userInfo: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
    };
    deliveryChoice: 'postal' | 'handover' | null;
    handoverOption: string;
    postalInformation: PostalInformation | null;
    paymentStatus: 'paid' | 'pending' | 'notpaid';
}
export declare class WinnerOnAuction {
    constructor(data: Partial<WinnerOnAuction>);
    id: string;
    auctionId: string;
    items: AuctionItem[];
    bids: Bid[];
    userInfo: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
    };
    deliveryChoice: 'postal' | 'handover' | null;
    handoverOption: string;
    postalInformation: PostalInformation | null;
    paymentStatus: 'paid' | 'pending' | 'notpaid';
}
export declare class PostalInformation {
    fullName: string;
    address: string;
    phoneNumber: string;
}
export declare class AuctionItem {
    constructor(data: Partial<AuctionItem>);
    id: string;
    auctionId: string;
    name: string;
    description: string;
    media: FirebaseFile[];
    startBid: number;
    bidId: string;
    bid: number;
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
    phoneNumber: string;
    endAuctionMailSent?: boolean;
}
export interface TrackedItem {
    auctionId: string;
    itemId: string;
    userId: string;
}
export declare class User {
    id: string;
    displayName: string;
    email: string;
    avatar: string;
    phoneNumber: string;
    signInMethod: string;
    providerId: string;
    emailSettings: EmailSettings;
}
export interface EmailSettings {
    auctionAnnouncements: boolean;
    bidUpdates: boolean;
}
