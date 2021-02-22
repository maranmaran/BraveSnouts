import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentData, QueryFn } from "@angular/fire/firestore";
import { WinnerOnAuction } from './../../../../../functions/src/models/models';
import { RepositoryBase } from "./base.repository";

@Injectable()
export class WinnersRepository extends RepositoryBase {

  constructor(
    private readonly firestore: AngularFirestore
  ) {
    super();
  }

  public getAuctionWinners(auctionId: string, queryFn?: QueryFn<DocumentData>) {
    return this.firestore.collection<WinnerOnAuction>(`auctions/${auctionId}/winners`, queryFn).valueChanges({ idField: 'id' });
  }


}
