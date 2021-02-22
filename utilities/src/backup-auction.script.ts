import * as admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import { User } from './../../functions/src/models/models';
import { AuctionItem, Winner } from './models';

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
    
        const usersMap:Map<string, User> = new Map<string, User>();
        const winnersMap: Map<string, Winner> = new Map<string, Winner>();

        const perItemData: any[][] = [];
        perItemData.push([
            "ID Predmeta",
            "Naziv Predmeta",
            "Bid (formatted)",
            "Bid (raw)",
            "Pobjednik ID",
            "Pobjednik ime",
            "Pobjednik email"
        ]);

        const perWinnerData: any[][] = [];
        perWinnerData.push([
            "ID",
            "Ime",
            "Email",
            "Izabrana opcija preuzimanja",
            "Informacije za preuzimanje",
            "Predmeti"
        ]);
    
        for (const item of items) {
            const itemData = item.data() as AuctionItem;
    
            // per item data
            if(!usersMap.has(itemData.user)) {
                const user = await (await store.doc(`users/${itemData.user}`).get()).data() as User;
    
                usersMap.set(itemData.user, user);
            }

            const user = usersMap.get(itemData.user);
            perItemData.push([
                item.id,
                itemData.name,
                itemData.user ? itemData.bid + " kn" : '',
                itemData.user ? itemData.bid : 0,
                itemData.winner?.userId,
                itemData.winner?.userInfo?.name,
                itemData.winner?.userInfo?.email,
            ])

            // per winner data
            let winner = itemData.winner;
            if(!winner) continue;
    
            if(!winnersMap.has(winner.userId)) {
                perWinnerData.push([
                    winner.userId,
                    winner.userInfo.name,
                    winner.userInfo.email,
                    winner.deliveryChoice ?? 'Not chosen',
                    winner.deliveryChoice == 'postal' ? `${winner.postalInformation?.address}, ${winner.postalInformation?.address}, ${winner.postalInformation?.address}` :
                    winner.deliveryChoice == 'handover' ? winner.handoverOption : '',
                    itemData.name
                ])

                winnersMap.set(winner.userId, winner);
            } else {
                const idx = perWinnerData.findIndex(x => x[0] == winner.userId);
                perWinnerData[idx][5] = perWinnerData[idx][5] + ', ' + itemData.name
            }
        }
        
        if(perItemData.length == 0) {
            console.log("No data");
            return;
        } 
    
        const wb = XLSX.utils.book_new();
        wb.SheetNames.push("PerItemData"); // all items and some other data
        wb.SheetNames.push("PerWinnerData"); // only winners
        wb.Props = {
            Title: "Winners",
        };
        
        const ws1 = XLSX.utils.aoa_to_sheet(perItemData);
        wb.Sheets["PerItemData"] = ws1;
        const ws2 = XLSX.utils.aoa_to_sheet(perWinnerData);
        wb.Sheets["PerWinnerData"] = ws2;
    
        XLSX.writeFile(wb, "Winners.xlsx", { bookType: 'xlsx'} );
        console.log("Done");
    }
    catch(err) {
        console.log(err);
    }
}

backupAuction("022b15af-254d-4cb9-ae00-f4ddaa4c159f");