export class User {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  signInMethod: string;
  providerId: string;
  emailSettings: EmailSettings;

  code?: string;

  // admin: make user change email
  overrideEmail: {
    reason: string;
  };
  // admin: inform user with custom message
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
