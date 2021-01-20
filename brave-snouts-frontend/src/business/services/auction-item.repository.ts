import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QueryFn } from '@angular/fire/firestore';
import { AuctionItem } from 'src/business/models/auction-item.model';

@Injectable({ providedIn: 'root' })
export class AuctionItemRepository {

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }

    getCollection(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        return this.firestore
            .doc(`auctions/${auctionId}`)
            .collection<AuctionItem>('items', queryFn);
    }

    getDocument(auctionId: string, id: string) {
        return this.firestore
            .doc<AuctionItem>(`auctions/${auctionId}/items/${id}`);
    }

    getAll(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        return this.getCollection(auctionId, queryFn).valueChanges({ idField: 'id' });
    }

    getOne(auctionId: string, id: string) {
        return this.getDocument(auctionId, id).valueChanges({ idField: 'id' });
    }

    create(auctionId: string, data: AuctionItem) {
        return this.getCollection(auctionId).add(Object.assign({}, data));
    }

    writeBatch(auctionId: string, items: AuctionItem[]) {

        const batch = this.firestore.firestore.batch();

        items.forEach(item => {
            item.auctionId = auctionId;
            const docRef = this.getDocument(item.auctionId, item.id ?? this.firestore.createId());
            batch.set(docRef.ref, Object.assign({}, item)); // destructive because we can "delete" media 
        });

        return batch.commit();
    }

    update(auctionId: string, id: string, data: Partial<AuctionItem>) {
        return this.getDocument(auctionId, id).update(data);
    }

    set(auctionId: string, id: string, data: AuctionItem) {
        this.getDocument(auctionId, id).set(Object.assign({}, data));
    }

    delete(auctionId: string, id: string) {
        return this.getDocument(auctionId, id).delete();
    }

    query(query) {
        return this.getCollection(query).valueChanges({ idField: 'id' });
    }

}
