import { europeFunctions, store } from "..";
import { AuctionItem, UserInfo } from "../models/models";
import { sendHandoverDetailsUpdateMail } from "../services/mail.service";

/** Sends email update to all people with new handover details for auction */
export const changeHandoverFn = europeFunctions.https.onCall(
    async (data, context) => {

        const auctionId = data.auctionId;
        const handoverDetails = data.handoverDetails;

        try {
            // get winners by auctionId
            const itemDocs = await store.collection(`auctions/${auctionId}/items`).get();

            const items = itemDocs.docs.map(item => (item.data() as AuctionItem));

            for (const item of items) {
                if(item.winner?.userInfo) {
                    await sendHandoverDetailsUpdateMail(item.winner?.userInfo as UserInfo, handoverDetails);
                }
            }

            // update auction
            await store.collection('auctions').doc(auctionId).set({ handoverDetails }, { merge: true });

            return { status: 'ok', code: 200 };
        }
        catch (error) {
            return { status: 'error', code: 401, message: 'Failed to send handover details update' }
        }

    }
);
