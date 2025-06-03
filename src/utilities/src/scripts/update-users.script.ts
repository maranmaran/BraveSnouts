
import { Auction, AuctionItem, Bid, UserInfo } from '../../../functions/src/functions/auctions/models/models.js';
import { store } from '../base-setup.js';


(async () => {
    const message = "Ispričavamo se ako ste dobili duplicirane mailove.\nImali smo problema s planom od mail providera.\n\nUkoliko ste već odabrali opciju preuzimanja slobodno ignorirajte nove mailove.\n\nHvala na razumijevanju!"

    const auctionIds = [
        "44c9addf-0be9-486c-adee-b16ac20cf898",
        "802e7a38-9053-40d1-b698-bae675ef4013",
        "c4dc15dd-2ae2-4985-b7bc-2749ad0b4d6c",
    ]

    const userBids = await getAllAuctionUserBidsMap(auctionIds);
    const userBidsTransformed = new Map<UserInfo, Bid[]>();
    for (const [_, val] of userBids) {
        userBidsTransformed.set(val.user, val.bids);
    }

    await store.doc(`users/qK3UyygxawQ00gfR1lCJ3Qk2PEf1`).update({ informUser: { message } })

    for (const [userInfo, bids] of userBidsTransformed) {
        await store.doc(`users/${userInfo.id}`).update({ informUser: { message } })
    }
})();


async function getAuctions(auctionIds: string[]) {
    const auctions: Auction[] = [];
    for (const auctionId of auctionIds) {
        auctions.push(await getAuction(auctionId));
    }

    return auctions;
}

async function getAllAuctionUserBidsMap(auctionIds: string[]) {
    const allAuctionUserBidsMap = new Map<string, { user: UserInfo, bids: Bid[] }>();
    for (const auctionId of auctionIds) {
        // Get auction items data
        // Filter out only items that were bid on
        console.log("Retrieving items")
        const items: AuctionItem[] = await getAuctionItems(auctionId);

        // Retrieve bids
        console.log("Retrieving bids")
        const bids = getBids(items);

        // Retrieve user information
        console.log("Retrieving user information")
        const userIds = [...(new Set(bids.map(bid => bid.user)))];
        const userInfo = await getUserInformation(userIds);

        // Group user bids
        const userBidsMap = getUserBidsMap(bids, userInfo);

        for (const [key, value] of userBidsMap) {
            if (allAuctionUserBidsMap.has(key.id)) {
                allAuctionUserBidsMap.set(
                    key.id,
                    { user: key, bids: [...allAuctionUserBidsMap.get(key.id).bids, ...value] }
                )
            } else {
                allAuctionUserBidsMap.set(key.id, { user: key, bids: value });
            }
        }
    }

    return allAuctionUserBidsMap;
}


/** Retrieves specific auction data */
async function getAuction(auctionId: string) {

    const auction = await store.doc(`auctions/${auctionId}`).get();

    if (!auction.exists) {
        throw new Error(`Auction ${auctionId} not found`);
    }

    return { id: auction.id, ...auction.data() } as Auction;
}

/** Retrieves auction items */
async function getAuctionItems(auctionId: string) {

    const itemsQuery = store.doc(`auctions/${auctionId}`).collection('items');
    const itemsSnapshot = await itemsQuery.get();
    const items = itemsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AuctionItem[];

    if (items.length === 0) {
        const message = 'No items found';
        console.log(message);
        throw new Error(message);
    }

    return items;
}

/** Reduces auction items and retrieves array of relevant bids */
function getBids(items: AuctionItem[]) {
    const bids = items
        .filter(item => item.bid > 0 && item.user)
        .map(item => ({ value: item.bid, user: item.user, item }) as Bid);

    if (bids?.length === 0) {
        const message = 'No bids found';
        console.log(message);
    }

    return bids ?? [];
};

/** Retrieves authenticated users information (Email, Name ..etc) */
async function getUserInformation(userIds: string[]) {
    const userInfoMap = new Map<string, UserInfo>();

    for await (const userId of userIds) {
        try {

            if (userInfoMap.has(userId)) {
                // already seen
                continue;
            }

            // add to map
            const userDb = await (await store.doc(`users/${userId}`).get()).data();

            userInfoMap.set(userId, {
                id: userId,
                name: userDb.displayName,
                email: userDb.email,
                phoneNumber: userDb.phoneNumber,
                endAuctionMailSent: userDb.endAuctionMailSent
            });

        } catch (error) {
            console.log(`${error}`);
            console.log(`User not found ${userId}`);
        }
    }

    // do work
    return userInfoMap;
}

/** Retrieves users bid grouped and returns a Map for O(1) access */
function getUserBidsMap(bids: Bid[], userInfoMap: Map<string, UserInfo>): Map<UserInfo, Bid[]> {
    const userBidsMap = new Map<UserInfo, Bid[]>();

    userInfoMap.forEach(info => {
        const userBids = bids.filter(bid => bid.user === info.id);

        userBidsMap.set(info, userBids);
    });

    return userBidsMap;
}
