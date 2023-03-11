export class Bid {
  constructor(data: Partial<Bid>) {
    Object.assign(this, data);
  }

  id: string;
  auctionId: string;
  itemId: string;
  userId: string;
  userInfo: UserInfo;
  bid: number;
  bidBefore: number;
  userBefore: string;
  bidIdBefore: string;
  date: any;
}

export class UserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
