import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { europeFunctions, store } from "..";
import { Auction, AuctionItem, User, Winner } from "../models/models";
import { WinnerOnAuction } from './../models/models';
const os = require('os');
const path = require('path');

/** Sends email update to all people with new handover details for auction */
export const exportAuctionFn = europeFunctions.https.onCall(
    async (data, context) => {

        const ids = data.auctionIds;

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

        let sheetTitle = '';
        
        const usersMap: Map<string, User> = new Map<string, User>();
        const winnersMap: Map<string, Winner> = new Map<string, Winner>();
        const winnerItemsMap: Map<string, AuctionItem[]> = new Map<string, AuctionItem[]>();
        
        for(const id of ids) {
            const auction = (await (await store.doc(`auctions/${id}`).get()).data()) as Auction;
            const winners = (await store.collection(`auctions/${id}/winners`).get()).docs.map(d => d.data()) as WinnerOnAuction[];
            const items = [].concat(...winners.map(x => x.items));
            
            sheetTitle += auction.name + '_';
    
            for (const item of items) {
                const itemData = item as AuctionItem;
                const winner = itemData.winner;
    
                if (!winner) continue;
    
                // save user
                if (!usersMap.has(itemData.user)) {
                    const user = await (await store.doc(`users/${itemData.user}`).get()).data() as User;
                    usersMap.set(itemData.user, user);
                }
    
                // save winner
                if (!winnersMap.has(winner.userId)) {
                    winnersMap.set(winner.userId, winner);
                }
    
                // save items for each winner
                if (!winnerItemsMap.has(winner.userId)) {
                    winnerItemsMap.set(winner.userId, [itemData]);
                } else {
                    const currentItems = winnerItemsMap.get(winner.userId) as AuctionItem[];
                    winnerItemsMap.set(winner.userId, [...currentItems, itemData]);
                }
    
                itemsSheetData.push([
                    `${itemData.name.toUpperCase()}, ${itemData.description}`,
                    itemData.winner.userInfo?.name,
                    itemData.bid
                ])
            }
            
        }

        let totalSum = 0;
        for (const [winnerId, winnerItems] of Array.from(winnerItemsMap.entries())) {

            let nameWritten = false;
            let userSum = 0;
            const winner = winnersMap.get(winnerId) as Winner;

            for (const item of winnerItems as AuctionItem[]) {
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

        for (const [winnerId, winner] of Array.from(winnersMap.entries())) {
            sendSheetData.push([
                winner.userInfo.name,
                winner.postalInformation?.fullName,
                winner.deliveryChoice === 'handover' ?
                    winner.handoverOption :
                    winner.deliveryChoice === 'postal' ?
                        'pošta' :
                        'nije izabrano',
                winner.postalInformation?.address,
                winner.postalInformation?.phoneNumber ?? usersMap.get(winner.userId)?.phoneNumber,
                winner.userInfo.email
            ]);
        }
        
        sheetTitle = sheetTitle.substr(0, sheetTitle.length - 1)

        const wb = XLSX.utils.book_new();
        wb.SheetNames.push("PREDMETI");
        wb.SheetNames.push("DONATORI");
        wb.SheetNames.push("SLANJE");
        wb.Props = {
            Title: sheetTitle,
        };

        const ws1 = XLSX.utils.aoa_to_sheet(itemsSheetData);
        wb.Sheets["PREDMETI"] = ws1;
        const ws2 = XLSX.utils.aoa_to_sheet(donatorsSheetData);
        wb.Sheets["DONATORI"] = ws2;
        const ws3 = XLSX.utils.aoa_to_sheet(sendSheetData);
        wb.Sheets["SLANJE"] = ws3;

        const exportFilePath = path.join(os.tmpdir(), `${sheetTitle}.xlsx`);
        XLSX.writeFile(wb, exportFilePath, { bookType: 'xlsx' });

        logger.log(process.env.FIREBASE_STORAGE_BUCKET);
        
        const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

        const response = await bucket.upload(exportFilePath,  
            { 
                destination: `exports/${sheetTitle}.xlsx`, 
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sh', 
                gzip: false,
                public: true, 
                metadata: {
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sh',
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(),
                    }
                } 
            }
        );

        logger.log("Done exporting");
        return response;
    }
);
