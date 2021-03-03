import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentData, QueryFn } from "@angular/fire/firestore";
import { WinnerOnAuction } from "src/business/models/winner.model";
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

  public setAuctionWinner(auctionId: string, winner: WinnerOnAuction, queryFn?: QueryFn<DocumentData>) {
    return this.firestore.doc<WinnerOnAuction>(`auctions/${auctionId}/winners/${winner.id}`).set(Object.assign({}, winner), { merge: true})
  }

  public updateAuctionWinner(auctionId: string, winnerId: string, winner: Partial<WinnerOnAuction>, queryFn?: QueryFn<DocumentData>) {
    return this.firestore.doc<WinnerOnAuction>(`auctions/${auctionId}/winners/${winnerId}`).update(winner);
  }

}
