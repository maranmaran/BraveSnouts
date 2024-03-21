import { faker } from '@faker-js/faker';
import { firestore } from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import { Auction } from '../models';

export class AuctionGenerator {
    async generate(itemCount: number) {
        return <Auction>{
            id: uuid(),
            name: faker.commerce.productName() + " " + itemCount,
            description: faker.lorem.paragraph(),
            archived: false,
            processed: false,
            startDate: firestore.Timestamp.fromDate(faker.date.recent()),
            endDate: firestore.Timestamp.fromDate(faker.date.soon()),
            raisedMoney: 0
        };
    }
}