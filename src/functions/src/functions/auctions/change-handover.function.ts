import { logger } from "firebase-functions";
import { UserInfo, WinnerOnAuction } from "./models/models";
import { sendHandoverDetailsUpdateMail } from "./services/mail-factories/handover-information-mail.factory";

/** Sends email update to all people with new handover details for auction */
export const changeHandoverFn = functions.region('europe-west1').https.onCall(
    async (data, context) => {

        const auctionIds = data.auctionIds as string[];
        const handoverDetails = data.handoverDetails;

        try {

            const usersMap = new Map<string, UserInfo>();

            for (const auctionId of auctionIds) {
                const winnerDocs = await admin.firestore().collection(`auctions/${auctionId}/winners`).get();
                const winners = winnerDocs.docs.map(winner => (winner.data() as WinnerOnAuction));

                for (const winner of winners) {
                    usersMap.set(winner.userInfo.id, winner.userInfo);
                }

                await admin.firestore().collection('auctions').doc(auctionId).set({ handoverDetails }, { merge: true });
            }

            for (const [_, userInfo] of usersMap) {
                await sendHandoverDetailsUpdateMail(userInfo, auctionIds, handoverDetails);

                logger.info(`Lokacija preuzimanja promijenjena za korisnika: <b>${userInfo.name}</b> na lokaciju: <b>${handoverDetails}</b>`);
                // const adminUpdateMessage = `Lokacija preuzimanja promijenjena za korisnika: <b>${userInfo.name}</b> na lokaciju: <b>${handoverDetails}</b>`;
                // await sendMail(getComposer("app.hrabrenjuske@gmail.com", `${userInfo.name} je promijenio/la lokaciju preuzimanja`, adminUpdateMessage));
            }


            return { status: 'ok', code: 200 };
        }
        catch (error) {
            logger.error(error);
            return { status: 'error', code: 401, message: 'Failed to send handover details update' }
        }

    }
);
