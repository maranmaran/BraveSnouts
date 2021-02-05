import { Auction } from "./models"
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import moment from "moment";
import { importFullAuction } from "./import-full-auction.script";

(async () => {
    console.log("\nDoing import")

    let imagesDir = process.cwd() + "\\utilities\\data\\images";
    let transformDir = process.cwd() + "\\utilities\\data\\transformed-images";

    let auction = new Auction({
        id: uuidv4(),
        name: `Past auction non processed`,
        description: "This auction is in past and is not processed soon to be archived",
        startDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment(new Date()).subtract(28, 'days').toDate()),
        archived: false,
        processed: true,
    });
    let importFilePath = process.cwd() + "\\utilities\\data\\items_20.xlsx"

    await importFullAuction(false, true, true, imagesDir, transformDir, importFilePath, auction, 100, false);

    console.log("Everything is finished");
})()

