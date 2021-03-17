import { europeFunctions, store } from "..";
import { WinnerOnAuction } from "../models/models";
import { sendHandoverDetailsUpdateMail } from "../services/mail.service";
import { UserInfo } from './../models/models';

/** Sends email update to all people with new handover details for auction */
export const changeHandoverFn = europeFunctions.https.onCall(
    async (data, context) => {

        const auctionIds = data.auctionIds as string[];
        const handoverDetails = data.handoverDetails;

        try {

            const usersMap = new Map<string, UserInfo>();

            for(const auctionId of auctionIds) {
                const winnerDocs = await store.collection(`auctions/${auctionId}/winners`).get();
                const winners = winnerDocs.docs.map(winner => (winner.data() as WinnerOnAuction));
                
                for(const winner of winners) {
                    if(!usersMap.has(winner.userInfo.id))
                    usersMap.set(winner.userInfo.id, winner.userInfo);
                }

                await store.collection('auctions').doc(auctionId).set({ handoverDetails }, { merge: true });
            }

            for (const [_, userInfo] of usersMap) {
                await sendHandoverDetailsUpdateMail(userInfo, auctionIds, handoverDetails);
            }

            return { status: 'ok', code: 200 };
        }
        catch (error) {
            return { status: 'error', code: 401, message: 'Failed to send handover details update' }
        }

    }
);
