import { europeFunctions, mailSettings } from '../app';
import { Auction, AuctionItem, Bid, User, UserInfo } from './models/models';
import { sendHandoverConfirmationMail, sendHandoverDetailsUpdateMail } from './services/mail-factories/handover-information-mail.factory';
import { sendOutbiddedMail } from './services/mail-factories/outbidded-mail.factory';
import { sendPostConfirmationMail } from './services/mail-factories/post-information-mail.factory';
import { sendWinnerMail } from './services/mail-factories/winner-mail.factory';

export const testAuctionMailsFn = europeFunctions().https.onCall(
    async (data, context) => {

        const mailVariables = await mailSettings().getMailVariables();

        const itemCount = data.itemsCount ?? 10;

        const fakeAuctions: Auction[] = [];
        const fakeAuctionIds = fakeAuctions.map(x => x.id);
        const fakeHandoverDetails = ["test lokacija 1", "test lokacija 2"];
        const fakeAuctionItem = getFakeAuctionItem();
        const fakeUser = getFakeUser(data.email);
        const fakeUserInfo = getFakeUserInfo(data.email);
        const fakeBids = getBids(itemCount, fakeUserInfo);

        await sendWinnerMail(fakeAuctions, fakeHandoverDetails, fakeUserInfo, fakeBids, mailVariables);
        await sendHandoverConfirmationMail(fakeUser, fakeAuctionIds, fakeHandoverDetails[0]);
        await sendOutbiddedMail(fakeUserInfo, fakeAuctionItem, fakeAuctionItem);
        await sendPostConfirmationMail(fakeUser, fakeAuctionIds, 'Fake option selected', '500', 'Fake payment details', 25);
        await sendHandoverDetailsUpdateMail(fakeUserInfo, fakeAuctionIds, fakeHandoverDetails);
    }
);

// TODO: Use faker
function getBids(count: number, useInfo: UserInfo) {
    let bids: Bid[] = []
    for (let i = 0; i < count; i++) {
        bids.push(getFakeBid(useInfo))
    }
    return bids;
}

function getFakeAuctionItem() {
    return <AuctionItem>{
        id: 'Fake ID',
        auctionId: 'Fake auction',
        name: 'Fake name',
        description: 'Fake description',
        media: [],
        startBid: 0,
        bidId: 'Fake bid ID',
        bid: 5,
        user: 'Fake user',
        winner: null
    }
}

function getFakeUserInfo(email: string) {
    return <UserInfo>{
        email: email,
        id: "fakeId",
        name: "Fake user",
        phoneNumber: "Fake phone",
        endAuctionMailSent: false
    };
}

function getFakeUser(email: string) {
    return <User>{
        id: 'Fake ID',
        displayName: 'Fake user',
        email: email,
        avatar: 'Fake avatar',
        phoneNumber: 'Fake phone',
        signInMethod: 'gmail',
        providerId: 'gmail',
        emailSettings: {
            auctionAnnouncements: true,
            bidUpdates: true
        }
    }
}

function getFakeBid(user: UserInfo) {
    return {
        item: {
            name: "Test item",
            "auctionId": "testId",
            media: null,
            startBid: 0,
            bid: 20,
            description: "Test description",
            id: "test item id",
            bidId: "1",
            winner: {
                "userId": "testId",
                "auctionId": "testId",
                "itemId": "testId",
                "id": "testId",
                "bidId": "testId",
                "deliveryChoice": 'postal',
                "handoverOption": "test",
                "paymentStatus": "paid",
                "userInfo": user,
                "postalInformation": {
                    "address": "Test address",
                    "fullName": "Test full name",
                    "phoneNumber": "Test phone"
                }
            },
            "user": "Test user"
        },
        "user": "Test user",
        "value": 100
    } as Bid;
} 