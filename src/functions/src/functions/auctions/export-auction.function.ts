import { format } from "date-fns";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import { config } from "../../index.auctions";
import { AuctionItem, User, WinnerOnAuction } from "./models/models";
const os = require("os");
const path = require("path");

/** Sends email update to all people with new handover details for auction */
export const exportAuctionFn = functions.region('europe-west1').https.onCall(
  async (data) => {

    try {
      const ids = data.auctionIds;
      const filename = data.filename?.trim();

      const itemsSheetData: any[][] = [];
      itemsSheetData.push(["PREDMET", "LINK", "DONATOR", "DONACIJA"]);

      const donatorsSheetData: any[][] = [];
      donatorsSheetData.push(["DONATOR", "PREDMET", "DONACIJA"]);

      const sendSheetData: any[][] = [];
      sendSheetData.push([
        "DONATOR",
        "PUNO IME I PREZIME",
        "PREUZIMANJE/SLANJE",
        "ADRESA",
        "TELEFON",
        "EMAIL",
      ]);

      const sheetTitle =
        !filename || filename === ""
          ? `Export-${format(new Date(), "dd/MM/yy")}`
          : filename;

      const usersMap: Map<string, User> = new Map<string, User>();
      const winnersMap: Map<string, WinnerOnAuction> = new Map<
        string,
        WinnerOnAuction
      >();
      const winnerItemsMap: Map<string, AuctionItem[]> = new Map<
        string,
        AuctionItem[]
      >();
      const itemsMap: Map<string, AuctionItem> = new Map<string, AuctionItem>();

      // fill above MAPS and add all items data to PREDMETI sheet
      for (const id of ids) {
        const items = (
          await admin.firestore().collection(`auctions/${id}/items`).get()
        ).docs.map((d) => d.data()) as AuctionItem[];
        for (const item of items) {
          itemsMap.set(item.id, item);
        }

        const winners = (
          await admin.firestore().collection(`auctions/${id}/winners`).get()
        ).docs.map((d) => d.data()) as WinnerOnAuction[];
        for (const winner of winners) {
          const userId = winner.id;
          const user = (await (
            await admin.firestore().doc(`users/${userId}`).get()
          ).data()) as User;

          if (!usersMap.has(userId)) {
            usersMap.set(userId, user);
          }

          if (!winnersMap.has(userId)) {
            winnersMap.set(userId, winner);
          }

          // save items for each winner
          if (!winnerItemsMap.has(userId)) {
            winnerItemsMap.set(userId, winner.items);
          } else {
            const currentItems = winnerItemsMap.get(userId) as AuctionItem[];
            winnerItemsMap.set(userId, [...currentItems, ...winner.items]);
          }

          for (const item of winner.items) {
            itemsSheetData.push([
              `${item.name.toUpperCase()}, ${itemsMap.get(item.id).description}`,
              `${config.base.url}/aukcije/predmet;auctionId=${item.auctionId};itemId=${item.id}`,
              winner.userInfo?.name,
              item.bid,
            ]);
          }
        }
      }

      // prepare DONATORI sheet
      let totalSum = 0;
      for (const [winnerId, winnerItems] of Array.from(
        winnerItemsMap.entries()
      )) {
        let nameWritten = false;
        let userSum = 0;
        const winner = winnersMap.get(winnerId);

        for (const item of winnerItems as AuctionItem[]) {
          donatorsSheetData.push([
            !nameWritten ? winner.userInfo.name : "",
            `${item.name.toUpperCase()}, ${itemsMap.get(item.id).description}`,
            item.bid,
          ]);

          nameWritten = true;
          userSum += item.bid;
          totalSum += item.bid;
        }

        userSum = Math.round(userSum * 100) / 100;
        donatorsSheetData.push([`${winner.userInfo.name} Total`, "", userSum]);
      }

      totalSum = Math.round(totalSum * 100) / 100;
      donatorsSheetData.push(["Grand total", "", totalSum]);

      // prepare SLANJE sheet
      for (const [winnerId, winner] of Array.from(winnersMap.entries())) {
        sendSheetData.push([
          winner.userInfo.name,
          winner.postalInformation?.fullName,
          winner.deliveryChoice === "handover"
            ? winner.handoverOption
            : winner.deliveryChoice === "postal"
              ? "pošta"
              : "nije izabrano",
          winner.postalInformation?.address,
          winner.postalInformation?.phoneNumber ??
          usersMap.get(winnerId)?.phoneNumber,
          winner.userInfo.email,
        ]);
      }

      // sheetTitle = sheetTitle.substr(0, sheetTitle.length - 1);

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
      XLSX.writeFile(wb, exportFilePath, { bookType: "xlsx" });

      const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

      const response = await bucket.upload(exportFilePath, {
        destination: `exports/${sheetTitle}.xlsx`,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sh",
        gzip: false,
        public: true,
        metadata: {
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sh",
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      logger.log("Done exporting");
      return response;
    } catch (e) {
      logger.error(e);
      throw e;
    }

  }
);
