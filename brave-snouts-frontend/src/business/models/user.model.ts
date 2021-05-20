export class User {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  signInMethod: string;
  providerId: string;
  emailSettings: EmailSettings;
  overrideEmail: {
    reason: string;
  };
  informUser: {
    message: string;
  };

  constructor(user: Partial<User>) {
    Object.assign(this, user);

    this.emailSettings = {
      auctionAnnouncements: true,
      bidUpdates: true,
    };
  }
}

export interface EmailSettings {
  auctionAnnouncements: boolean;
  bidUpdates: boolean;
}
