export class Bid {
  constructor(data: Partial<Bid>) {
    Object.assign(this, data);
  }

  id: string;
  itemId: string;
  userId: string;
  bid: number;
  date: any;
}
