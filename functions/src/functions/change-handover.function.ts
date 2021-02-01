import { europeFunctions, store } from "..";
import { AuctionItem, UserInfo } from "../models/models";
import { sendHandoverDetailsUpdateMail } from "../services/mail.service";

/** Sends email update to all people with new handover details for auction */
export const changeHandoverFunction = europeFunctions.https.onCall(
    async (data, context) => {

        const auctionId = data.auctionId;
        const handoverDetails = data.handoverDetails;

        try {
            // get winners by auctionId
            const items = await store.collection(`auctions/${auctionId}/items`).get();

            const winners = items.docs.map(item => (item.data() as AuctionItem).winner.userInfo);

            for (const winner of winners) {
                await sendHandoverDetailsUpdateMail(winner as UserInfo, handoverDetails);
            }

        }
        catch (error) {
            return { status: 'error', code: 401, message: 'Failed to send handover details update' }
        }

    }
);
