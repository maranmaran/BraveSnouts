import { logger } from 'firebase-functions';
import { europeFunctions, settingsSvc } from '../..';
import { Auction, Bid, UserInfo } from './models';
import { sendWinnerMail } from './services/mail-factories/winner-mail.factory';

export const testSendWinnerMailFn = europeFunctions.https.onCall(
    async (data, context) => {

        try {

            const itemCount = data.itemCount ?? 10;
            const handoverDetails = ["test lokacija 1", "test lokacija 2"];

            const testUser: UserInfo = {
                email: data.email,
                id: "testId",
                name: "Test user",
                phoneNumber: "Test phone",
                endAuctionMailSent: false
            };


            const bids: Bid[] = [];

            for (let i = 0; i < itemCount; i++) {
                bids.push(getBid(testUser));
            }

            const auctions: Auction[] = [];


            const mailVariables = await settingsSvc.getMailVariables();

            await sendWinnerMail(auctions, handoverDetails, testUser, bids, mailVariables);

            return null;

        } catch (e) {
            logger.error(e);
            throw e;
        }
    }
);


function getBid(user: UserInfo) {
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