import * as admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import { User } from './../../functions/src/models/models';
import { AuctionItem } from './models';

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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

require('dotenv').config();

// WInners only
const backupAuction = async (id: string) => {
    
    try {
        const items = (await store.collection(`auctions/${id}/items`).get()).docs;
    
        const usersMap:Map<string, User> = new Map<string, User>();
    
        const data: any[][] = [];
    
        data.push([
            "ID Predmeta",
            "Naziv Predmeta",
            "Zadnji bid",
            "Zadnji korisnik ID",
            "Zadnji korisnik ime",
            "Zadnji korisnik email",
            "Pobjednik ID",
            "Pobjednik ime",
            "Pobjednik email"
        ]);
    
        for (const item of items) {
            const itemData = item.data() as AuctionItem;
    
            if(!usersMap.has(itemData.user)) {
                const user = await (await store.doc(`users/${itemData.user}`).get()).data() as User;
    
                usersMap.set(itemData.user, user);
            }
    
            const user = usersMap.get(itemData.user);
    
            data.push([
                item.id,
                itemData.name,
                itemData.bid + " kn",
                itemData.user,
                user?.displayName,
                user?.email,
                itemData.winner?.userId ?? "no winner id",
                itemData.winner?.userInfo?.name ?? "no winner",
                itemData.winner?.userInfo?.email ?? "no winner email",
            ])
        }
        if(data.length == 0) {
            console.log("No data");
            return;
        } 
    
        const options: XLSX.ParsingOptions = {};
    
        const wb = XLSX.utils.book_new();
        wb.SheetNames.push("Winners");
        wb.Props = {
            Title: "Winners",
        };
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        wb.Sheets["Winners"] = ws;
    
        XLSX.writeFile(wb, "Winners.xlsx", { bookType: 'xlsx'} );
        console.log("Done");
    }
    catch(err) {
        console.log(err);
    }
}

backupAuction("022b15af-254d-4cb9-ae00-f4ddaa4c159f");