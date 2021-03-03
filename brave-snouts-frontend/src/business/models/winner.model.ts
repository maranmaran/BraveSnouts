import { AuctionItem } from "./auction-item.model";
import { Bid } from "./bid.model";

// attached on **auction item document**
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
        phoneNumber: string;
    };

    deliveryChoice?: 'postal' | 'handover';
    handoverOption: string;
    paymentStatus: 'paid' | 'pending' | 'notpaid';
    postalInformation?: PostalInformation;
}

// Attached on **auction document**
export class WinnerOnAuction {

  constructor(data: Partial<WinnerOnAuction>) {
      Object.assign(this, data);
  }

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
  postalInformation: PostalInformation | null;
  handoverOption: string;
  paymentStatus: 'paid' | 'pending' | 'notpaid';
}


export class PostalInformation {
    fullName: string;
    address: string;
    phoneNumber: string;
}
