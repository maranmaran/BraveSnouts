import { europeFunctions, store } from "..";
import { Auction, User } from "../models/models";
import { sendNewItemsAddedMail } from './../services/mail.service';

/**
 * Informs users that new auction items have been added
 */
export const newItemsAddedFn = europeFunctions.https.onCall(
    async (data, context) => {
        try {
            const auctionId = data.auctionId;
            const auction = await getAuction(auctionId)
            const users = await getUsers();

            for (const user of users) {
                await sendNewItemsAddedMail(user, auction);
            }

            return { status: 200 };
        }
        catch (error) {
            return { status: 500, error }
        }
    }
);

/** Retrieves specific auction data */
const getAuction = async (auctionId: string) => {

    const auction = await store.doc(`auctions/${auctionId}`).get();

    if (!auction.exists) {
        throw new Error(`Auction ${auctionId} not found`);
    }

    return { id: auction.id, ...auction.data() } as Auction;
}

const getUsers = async () => {
    const usersQuery = store.collection('users')
        .where('emailSettings.auctionAnnouncements', '==', true);

    const usersSnap = await usersQuery.get();
    const users = usersSnap.docs.map(u => ({ id: u.id, ...u.data() })) as User[]

    return users;
}
