import { Injectable } from "@angular/core";
import { QueryFn, DocumentData, AngularFirestore } from "@angular/fire/firestore";
import { AuctionItem } from "src/business/models/auction-item.model";

@Injectable({providedIn: 'root'})
export class ItemsStoreRepository {
    
    public readonly pageSize = environment.pageSizes?.itemsList ?? 8;

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }
    
    getCollection(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        
        if(!queryFn)
            queryFn = ref => ref.orderBy("name", 'asc');

        return this.firestore
            .doc(`auctions/${auctionId}`)
            .collection<AuctionItem>('items', queryFn);
    }

    getDocument(auctionId: string, id: string) {
        return this.firestore
            .doc<AuctionItem>(`auctions/${auctionId}/items/${id}`);
    }

    getAll(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        return this.getCollection(auctionId, queryFn).valueChanges({ idField: 'id' })
    }

    getOne(auctionId: string, id: string) {
        return this.getDocument(auctionId, id).valueChanges({ idField: 'id' })
    }

    getInitialPage(auctionId) {
        let query = ref => ref
                              .orderBy('name', 'asc')
                              .orderBy('id', 'asc')
                              .limit(this.pageSize);

        return this.getCollection(auctionId, query).valueChanges({ idField: 'id' })
    }

    getNextPage(last: AuctionItem) {
        let query = ref => ref
                              .orderBy('name', 'asc')
                              .orderBy('id', 'asc')
                              .startAfter(last.name, last.id)
                              .limit(this.pageSize);

        return this.getCollection(last.auctionId, query).valueChanges({ idField: 'id' })
    }

    getPreviousPage(first: AuctionItem) {
        let query = ref => ref
                              .orderBy('name', 'asc')
                              .orderBy('id', 'asc')
                              .endBefore(first.name, first.id)
                              .limitToLast(this.pageSize);

        return this.getCollection(first.auctionId, query).valueChanges({ idField: 'id' })
    }

    create(auctionId: string, data: AuctionItem) {
        return this.getCollection(auctionId).add(Object.assign({}, data));
    }

    getId() {
        return this.firestore.createId()
    }

    writeBatch(auctionId: string, items: AuctionItem[]) {

        const batch = this.firestore.firestore.batch();

        items.forEach(item => {
            item.auctionId = auctionId;
            const docRef = this.getDocument(item.auctionId, item.id ?? this.getId());
            batch.set(docRef.ref, Object.assign({}, item, { id: docRef.ref.id} )); // destructive because we can "delete" media 
        });

        return batch.commit();
    }

    update(auctionId: string, id: string, data: Partial<AuctionItem>) {
        return this.getDocument(auctionId, id).update(data);
    }

    set(auctionId: string, id: string, data: AuctionItem) {
        return this.getDocument(auctionId, id).set(Object.assign({}, data));
    }

    delete(auctionId: string, id: string) {
        return this.getDocument(auctionId, id).delete();
    }

    /** Adds item on which user bid on to the database */
    addItemToUser(item: AuctionItem, userId: string) {
        return this.firestore.collection(`users/${userId}/tracked-items`)
        .doc(item.id).set({
            auctionId: item.auctionId,
            itemId: item.id,
            userId: userId,
        });
    }
    
    /** Retrieves only items on which user bid on */
    getUserItems(userId: string) {
        return this.firestore.collection(`users/${userId}/tracked-items`)
        .valueChanges({ idField: 'id' })
    }
}