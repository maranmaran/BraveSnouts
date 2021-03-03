import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QueryFn } from '@angular/fire/firestore';
import { Auction } from 'src/business/models/auction.model';

@Injectable()
export class AuctionRepository {

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }

    getCollection(queryFn?: QueryFn<DocumentData>) {
        return this.firestore.collection<Auction>('auctions', queryFn);
    }

    getDocument(id: string) {
        return this.firestore.doc<Auction>(`auctions/${id}`);
    }

    getAll(queryFn?: QueryFn<DocumentData>) {
        return this.getCollection(queryFn).valueChanges({ idField: 'id' });
    }

    getOne(id: string) {
        return this.getDocument(id).valueChanges({ idField: 'id' });
    }

    create(data: Auction) {
        return this.getCollection().add(Object.assign({}, data));
    }

    update(id: string, data: Partial<Auction>) {
        return this.getDocument(id).update(data);
    }

    set(id: string, data: Auction) {
        return this.getDocument(id).set(Object.assign({}, data), { merge: true });
    }

    delete(id: string) {
        return this.getDocument(id).delete();
    }

    query(query) {
        return this.getCollection(query).valueChanges({ idField: 'id' });
    }

}
