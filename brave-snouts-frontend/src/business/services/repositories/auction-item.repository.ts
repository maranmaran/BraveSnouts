import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, QueryFn } from '@angular/fire/firestore';
import { mergeMap, take } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuctionItemRepository {

    public readonly pageSize = environment.pageSizes?.itemsList ?? 8;

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }

    getCollection(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        if(!queryFn) {
            queryFn = ref => ref.orderBy("name", 'asc').orderBy("id", "asc");
        }

        return this.firestore.collection<AuctionItem>(`auctions/${auctionId}/items`, queryFn);
    }

    getDocument(auctionId: string, id: string) {
        return this.firestore
            .doc<AuctionItem>(`auctions/${auctionId}/items/${id}`);
    }

    getAll(auctionId: string, queryFn?: QueryFn<DocumentData>) {
        // console.error("Getting all prohibited");
        // return of([]);
        return this.getCollection(auctionId, queryFn).valueChanges({ idField: 'id' })
    }

    getOne(auctionId: string, id: string) {
        return this.getDocument(auctionId, id).valueChanges({ idField: 'id' })
    }

    getScrollPage(auctionId: string, last: AuctionItem) {

        const query = ref => {
            ref = ref.orderBy('name', 'asc').orderBy('id', 'asc');
            if(last) ref = ref.startAfter(last.name, last.id);
            return ref.limit(this.pageSize);
        }

        return this.getCollection(auctionId, query).snapshotChanges();
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
            batch.set(docRef.ref, Object.assign({}, item, { id: docRef.ref.id} ), { merge: true }); // destructive because we can "delete" media
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

    deleteTrackedItems(auctionId: string) {
        return this.firestore.collectionGroup("tracked-items", ref => ref.where("auctionId", "==", auctionId))
            .valueChanges()
            .pipe(
                take(1),
                mergeMap(items => [...items]),
                mergeMap((item: any) => this.firestore.doc(`users/${item.userId}/tracked-items/${item.itemId}`).delete())
            )
    }

}
