import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentData, QueryFn } from "@angular/fire/firestore";
import { Bid } from '../../models/bid.model';
import { RepositoryBase } from "./base.repository";

@Injectable()
export class BidsRepository extends RepositoryBase {

  constructor(
    private readonly firestore: AngularFirestore
  ) {
    super();
  }

  private getCollection(queryFn?: QueryFn<DocumentData>) {

    if(!queryFn) {
      queryFn = ref => ref.orderBy("date", "desc").limit(5);
    }
    
    return this.firestore.collection<Bid>('bids', queryFn);
  }

  private getDocument(id: string) {
    return this.firestore.doc<Bid>(`bids/${id}`);
  }

  getAll(queryFn?: QueryFn<DocumentData>) {
    return this.getCollection(queryFn).valueChanges({ idField: 'id' });
  }

  create(data: Bid) {
    return this.getCollection().add(Object.assign({}, data));
  }

  delete(id: string) {
    return this.getDocument(id).delete();
  }

  query(query) {
    return this.getCollection(query).valueChanges({ idField: 'id' });
  }

}
