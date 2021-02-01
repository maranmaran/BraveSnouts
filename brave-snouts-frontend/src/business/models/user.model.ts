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