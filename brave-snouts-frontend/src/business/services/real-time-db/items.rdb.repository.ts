// import { Injectable } from "@angular/core";
// import { AuctionItem } from "src/business/models/auction-item.model";
// import { AngularFireDatabase, QueryFn } from '@angular/fire/database';

// @Injectable({providedIn: 'root'})
// export class ItemsRdbRepository {

//     constructor(
//         private readonly db: AngularFireDatabase
//     ) {
        
//     }

//     getCollection(auctionId: string, queryFn?: QueryFn) {
        
//         if(!queryFn)
//             queryFn = ref => ref.orderByChild("name",);


//         return this.db.list<AuctionItem>(auctionId, queryFn);
//     }

//     getDocument(auctionId: string, id: string) {
//     }

//     getAll(auctionId: string, queryFn?: QueryFn) {
//     }

//     getOne(auctionId: string, id: string) {
//     }

//     getInitialPage(auctionId) {
//     }

//     getNextPage(last: AuctionItem) {
//     }

//     getPreviousPage(first: AuctionItem) {
//     }

//     create(auctionId: string, data: AuctionItem) {
//         return this.db.object(`auctions/${auctionId}/items/${data.id}`).set(data);
//     }

//     getId() {
//     }

//     writeBatch(auctionId: string, items: AuctionItem[]) {
//     }

//     update(auctionId: string, id: string, data: Partial<AuctionItem>) {
//     }

//     set(auctionId: string, id: string, data: AuctionItem) {
//     }

//     delete(auctionId: string, id: string) {
//     }

//     /** Adds item on which user bid on to the database */
//     addItemToUser(item: AuctionItem, userId: string) {
//     }
    
//     /** Retrieves only items on which user bid on */
//     getUserItems(userId: string) {
//     }
// }