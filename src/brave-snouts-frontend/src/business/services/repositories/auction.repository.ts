import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QueryFn } from '@angular/fire/compat/firestore';
import { first, map } from 'rxjs';
import { Auction } from 'src/business/models/auction.model';
import { AuctionState, getAuctionState } from '../auction.service';

@Injectable({ providedIn: 'root' })
export class AuctionRepository {

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }

    getAuctionsWithState(states: AuctionState[]) {
        // only non archived functions are potentially active
        const query = ref => ref.where('archived', '==', false);

        const nonArchivedAuctions = this.getAll(query).pipe(first());

        const activeFunctions = nonArchivedAuctions.pipe(
            map(auctions => auctions
                .map(a => ({ state: getAuctionState(a), ...a }))
                .filter(a => states.indexOf(a.state) != -1)
            ),
        )

        return activeFunctions.pipe(
            first(),
            map(a => a as Auction[]),
        );

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
