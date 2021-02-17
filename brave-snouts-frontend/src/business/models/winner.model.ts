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