
import { UserInfo } from '../../../functions/src/functions/auctions/models/models.js';
import { handoverConfirm } from '../../../functions/src/index.auctions';

const fakeUser: UserInfo = {
    name: 'Marko Urh',
    email: 'urh.marko@gmail.com',
    id: '3500a793-a570-44df-aca6-f5e510353041',
    phoneNumber: '123456',
}

const fakeAuctionIds = [
    '6cbdd796-8cd3-47c5-8a7f-ae1741de8634',
    '43d3911b-371a-449b-9ed5-2029464b64b5',
    '9621b4c9-2b3a-4679-a4d4-52069afd8743',
];

const fakeHandoverDetails = [
    'Preuzimanje kod Lidla',
    'Preuzimanje kod Konzuma'
];

(async () => {
    testWinnerMails();
})();

async function testWinnerMails() {
    await handoverConfirm.call(fakeUser, fakeAuctionIds, fakeHandoverDetails)
}

async function testPostInformationMails() {

}

async function testOutbiddedMails() {

}

async function testHandoverInformationMails() {

}
