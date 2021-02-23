import * as admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import { Auction, AuctionItem, User, Winner } from './models';

const path = require('path')
require('dotenv').config({ path: process.cwd() + '\\utilities\\.env' });

console.log(process.cwd() + '\\utilities\\.env');

var firebaseConfig = {
    credential: admin.credential.applicationDefault(),
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = admin.initializeApp(firebaseConfig);
const store = app.firestore();

// WInners only
const backupAuction = async (id: string) => {
    
    try {
        const items = (await store.collection(`auctions/${id}/items`).get()).docs;
        const auction = (await (await store.doc(`auctions/${id}`).get()).data()) as Auction;
    
        console.log(auction.name);
        
        const usersMap:Map<string, User> = new Map<string, User>();
        const winnersMap: Map<string, Winner> = new Map<string, Winner>();
        const winnerItemsMap: Map<string, AuctionItem[]> = new Map<string, AuctionItem[]>();

        const itemsSheetData: any[][] = [];
        itemsSheetData.push([
            "PREDMET",
            "DONATOR",
            "DONACIJA"
        ]); 

        const donatorsSheetData: any[][] = [];
        donatorsSheetData.push([
            "DONATOR",
            "PREDMET",
            "DONACIJA",
        ]);

        const sendSheetData: any[][] = [];
        sendSheetData.push([
            "DONATOR",
            "PUNO IME I PREZIME",
            "PREUZIMANJE/SLANJE",
            "ADRESA",
            "TELEFON",
            "EMAIL"
        ]);

        for (const item of items) {
            const itemData = item.data() as AuctionItem;
            const winner = itemData.winner;

            if(!winner) continue;

            // save user
            if(!usersMap.has(itemData.user)) {
                const user = await (await store.doc(`users/${itemData.user}`).get()).data() as User;
                usersMap.set(itemData.user, user);
            }

            // save winner
            if(!winnersMap.has(winner.userId)) {
                winnersMap.set(winner.userId, winner);
            } 

            // save items for each winner
            if(!winnerItemsMap.has(winner.userId)) {
                winnerItemsMap.set(winner.userId, [itemData]);
            } else {
                let currentItems = winnerItemsMap.get(winner.userId) as AuctionItem[];
                winnerItemsMap.set(winner.userId, [...currentItems, itemData]);
            }

            itemsSheetData.push([
                `${itemData.name.toUpperCase()}, ${itemData.description}`,
                itemData.winner.userInfo?.name,
                itemData.bid
            ])
        }

        let totalSum = 0;
        for(const [winnerId, items] of Array.from(winnerItemsMap.entries())) {

            let nameWritten = false;
            let userSum = 0;
            const winner = winnersMap.get(winnerId) as Winner;

            for(const item of items as AuctionItem[]) {
                donatorsSheetData.push([
                    !nameWritten ? winner.userInfo.name : "",
                    `${item.name.toUpperCase()}, ${item.description}`,
                    item.bid
                ]);

                nameWritten = true;
                userSum += item.bid;
                totalSum += item.bid;
            }

            donatorsSheetData.push([
                `${winner.userInfo.name} Total`,
                "",
                userSum
            ]);
        }
        donatorsSheetData.push([
            "Grand total",
            "",
            totalSum
        ])
        
        for(const [winnerId, winner] of Array.from(winnersMap.entries())) {
            sendSheetData.push([
                winner.userInfo.name,
                winner.postalInformation?.fullName,
                winner.deliveryChoice == 'handover' ?
                    winner.handoverOption : 
                    winner.deliveryChoice == 'postal' ? 
                        'pošta' :
                        'nije izabrano',
                winner.postalInformation?.fullName,
                winner.postalInformation?.address,
                winner.postalInformation?.phoneNumber,
                winner.userInfo.email
            ]);
        }

        const wb = XLSX.utils.book_new();
        wb.SheetNames.push("PREDMETI"); 
        wb.SheetNames.push("DONATORI"); 
        wb.SheetNames.push("SLANJE"); 
        wb.Props = {
            Title: auction.name,
        };
        
        const ws1 = XLSX.utils.aoa_to_sheet(itemsSheetData);
        wb.Sheets["PREDMETI"] = ws1;
        const ws2 = XLSX.utils.aoa_to_sheet(donatorsSheetData);
        wb.Sheets["DONATORI"] = ws2;
        const ws3 = XLSX.utils.aoa_to_sheet(sendSheetData);
        wb.Sheets["SLANJE"] = ws3;
    
        XLSX.writeFile(wb, `${auction.name}.xlsx`, { bookType: 'xlsx'} );
        console.log("Done");
    }
    catch(err) {
        console.log(err);
    }
}

backupAuction("022b15af-254d-4cb9-ae00-f4ddaa4c159f");