import { Auction } from "./models"
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { importFullAuction } from "./import-full-auction.script";

(async () => {
    let imagesDir = process.cwd() + "\\utilities\\data\\images";
    let transformDir = process.cwd() + "\\utilities\\data\\transformed-images";
    
    let download = false;
    let transform = false;
    
    if(download && transform) {
        // download and transform images
        await importFullAuction(false, true, false, imagesDir, transformDir);
    } else if (transform) {
        // only transform images
        await importFullAuction(false, true, false, imagesDir, transformDir);
    }
    
    let auctionActive400 = new Auction({
            id: "auctionActive400",
            name: `Active auction 400 `,
            description: "This auction has 400 items",
            startDate: admin.firestore.Timestamp.fromDate(new Date()),
            endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
            archived: false,
            processed: false,
    });
    let importFilePathActive400 = process.cwd() + "\\utilities\\data\\items_400.xlsx"
    
    let auctionActive100 = new Auction({
        id: "auctionActive100",
        name: `Active auction 100 `,
        description: "This auction has 100 items",
        startDate: admin.firestore.Timestamp.fromDate(new Date()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
        archived: false,
        processed: false,
    });
    let importFilePathActive100 = process.cwd() + "\\utilities\\data\\items_100.xlsx"
    
    let auctionActive20 = new Auction({
        id: "auctionActive20",
        name: `Active auction 20`,
        description: "This auction has 20 items",
        startDate: admin.firestore.Timestamp.fromDate(new Date()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
        archived: false,
        processed: false,
    });
    let importFilePathActive20 = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    let auctionFutureShort = new Auction({
        id: "auctionFutureShort",
        name: `Future auction short`,
        description: "This auction is in short future and has 20 items",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(4, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
        archived: false,
        processed: false,
    });
    let importFilePathFutureShort = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    let auctionFutureFar = new Auction({
        id: "auctionFutureFar",
        name: `Future auction far`,
        description: "This auction is in far future and has 20 items",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(30, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).add(60, 'days').toDate()),
        archived: false,
        processed: false,
    });
    let importFilePathFutureFar = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    let auctionPastNonProcessed = new Auction({
        id: "auctionPastNonProcessed",
        name: `Past auction non processed`,
        description: "This auction is in past and is not processed and has 20 items",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(20, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(5, 'days').toDate()),
        archived: false,
        processed: false,
    });
    let importFilePathPastNonProcessed = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    let auctionPastProcessedSoonToBeArchived = new Auction({
        id: "auctionPastProcessedSoonToBeArchived",
        name: `Past auction processed soon for archive`,
        description: "This auction is in past and is processed should be archived soon",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        archived: false,
        processed: true,
    });
    let importFilePathPastProcessedSoonToBeArchived = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    let auctionPastNonProcessedSoonToBeArchived = new Auction({
        id: "auctionPastNonProcessedSoonToBeArchived",
        name: `Past auction non processed`,
        description: "This auction is in past and is not processed soon to be archived",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        archived: false,
        processed: true,
    });
    let importFilePathPastNonProcessedSoonToBeArchived = process.cwd() + "\\utilities\\data\\items_20.xlsx"
    
    
    console.log("\nSeeding active auction with 400 items")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive400, auctionActive400, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive400, auctionActive400, 100, false);
    
    console.log("\nSeeding active auction with 100 items")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive100, auctionActive100, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive100, auctionActive100, 100, false);
    
    console.log("\nSeeding active auction with 20 items")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive20, auctionActive20, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathActive20, auctionActive20, 100, false);
    
    console.log("\nSeeding auction in short future")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathFutureShort, auctionFutureShort, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathFutureShort, auctionFutureShort, 100, false);
    
    console.log("\nSeeding auction in far future")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathFutureFar, auctionFutureFar, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathFutureFar, auctionFutureFar, 100, false);
    
    console.log("\nSeeding past non processed auction")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastNonProcessed, auctionPastNonProcessed, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastNonProcessed, auctionPastNonProcessed, 100, false);
    
    console.log("\nSeeding past about to be archived auction")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastProcessedSoonToBeArchived, auctionPastProcessedSoonToBeArchived, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastProcessedSoonToBeArchived, auctionPastProcessedSoonToBeArchived, 100, false);
    
    console.log("\nSeeding past about to be archived that's not processed auction")
    importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastNonProcessedSoonToBeArchived, auctionPastNonProcessedSoonToBeArchived, 100, false);
    // await importFullAuction(false, false, true, imagesDir, transformDir, importFilePathPastNonProcessedSoonToBeArchived, auctionPastNonProcessedSoonToBeArchived, 100, false);

    console.log("Everything is finished");
})()

