import * as admin from 'firebase-admin';
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';
import { importFullAuction } from "./import-full-auction.script";
import { Auction } from "./models";

(async () => {
    console.log("\nDoing import")

    let imagesDir = process.cwd() + "\\utilities\\data\\aukcija";
    let transformDir = process.cwd() + "\\utilities\\data\\aukcija-transformed";

    let auction = new Auction({
        id: uuidv4(),
        name: `Aukcija za Wilmu`,
        description: `Wilma je maca na skrbi udruge Hrabre njuške koja boluje od FIP-a. 
                      Prikupljenim donacijama s aukcije nabavit će se dio lijeka za njeno liječenje. 
                      Aukcija kreće u ponedjeljak 15.02., a traje do subote 20.02. u 20h. 
                      Najmanja ponuda za svaki od predmeta je navedena u opisu fotografije, a svaka sljedeća mora biti za barem 5kn veća. Predmet osvaja osoba s najvećom ponudom u navedenom vremenu.
                      Informacije o primopredaji i slanju osvojenih predmeta poslat ćemo svim dobitnicima nakon završetka aukcije.`,
        startDate: admin.firestore.Timestamp.fromDate(moment("15.02.2021 20:00", "DD.MM.yyyy HH:mm").toDate()),
        endDate: admin.firestore.Timestamp.fromDate(moment("20.02.2021 20:00", "DD.MM.yyyy HH:mm").toDate()),
        archived: false,
        processed: false,
        raisedMoney: 0
    });
    let importFilePath = process.cwd() + "\\utilities\\data\\Aukcija.xlsx"

    await importFullAuction(false, false, true, imagesDir, transformDir, importFilePath, auction, undefined, false);

    console.log("Everything is finished");
})()

