export class User {
    id: string;
    displayName: string;
    email: string;
    avatar: string;
    phoneNumber: string;
    signInMethod: string;
    providerId: string;
    emailSettings: EmailSettings

    constructor(user: Partial<User>) {
      Object.assign(this, user);

      this.emailSettings = {
        auctionAnnouncements: true,
        bidUpdates: true
      }
    }
}

export interface EmailSettings {
    auctionAnnouncements: boolean;
    bidUpdates: boolean;
}
