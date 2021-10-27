import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { europeFunctions } from "..";
import { store } from '../index';
const os = require('os');
const path = require('path');

/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export const downloadMailsFn = europeFunctions.https.onCall(
    async (data, context) => {

        try {

            const users = (await (await store.collection("/users/")
                .where("emailSettings.auctionAnnouncements", "==", true)
                .where("emailSettings.bidUpdates", "==", true)
            ).get()).docs;

            let sheetData = [];
            for (const user of users) {
                let userData = user.data();
                sheetData.push([userData.displayName, userData.email]);
            }

            const wb = XLSX.utils.book_new();
            wb.SheetNames.push("Mailovi");

            const ws1 = XLSX.utils.aoa_to_sheet(sheetData);
            wb.Sheets["Mailovi"] = ws1;

            const FILENAME = `Mailovi - ${(new Date()).toISOString()}`;

            const exportFilePath = path.join(os.tmpdir(), `${FILENAME}.xlsx`);
            XLSX.writeFile(wb, exportFilePath, { bookType: 'xlsx' });

            const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            const response = await bucket.upload(exportFilePath,
                {
                    destination: `exports/${FILENAME}.xlsx`,
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

            return response;

        } catch (e) {
            logger.error(e);
            throw e;
        }

    }
);