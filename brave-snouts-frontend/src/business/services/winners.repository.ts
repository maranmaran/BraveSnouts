import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentData, QueryFn } from "@angular/fire/firestore";
import { Bid } from '../models/bid.model';
import { Winner } from '../models/winner.model';
import { RepositoryBase } from "./base.repository";

@Injectable({ providedIn: 'root' })
export class WinnersRepository extends RepositoryBase {

  constructor(
    private readonly firestore: AngularFirestore
  ) {
    super();
  }

  getCollection(queryFn?: QueryFn<DocumentData>) {
    return this.firestore.collection<Winner>('winners', queryFn);
  }

  getDocument(id: string) {
    return this.firestore.doc<Winner>(`winners/${id}`);
  }

  getAll(queryFn?: QueryFn<DocumentData>) {
    return this.getCollection(queryFn).valueChanges({ idField: 'id' });
  }

  create(data: Winner) {
    return this.getCollection().add(Object.assign({}, data));
  }

  delete(id: string) {
    return this.getDocument(id).delete();
  }

  query(query) {
    return this.getCollection(query).valueChanges({ idField: 'id' });
  }

}
