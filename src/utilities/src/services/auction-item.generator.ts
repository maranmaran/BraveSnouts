import { faker } from '@faker-js/faker';
import { v4 as uuid } from 'uuid';
import { AuctionItem } from '../models';

export class AuctionItemGenerator {

    private readonly auctionId: string;

    constructor(auctionId: string) {
        this.auctionId = auctionId;
    }

    async generate(count: number) {
        const items: AuctionItem[] = [];
        for (let i = 0; i < count; i++) {
            const item = await this.generateSingle();
            items.push(item);
        }
        return items;
    }

    async generateSingle() {
        const generated = <AuctionItem>{
            id: uuid(),
            auctionId: this.auctionId,
            name: faker.commerce.productName(),
            description: faker.lorem.paragraph(),
            startBid: faker.datatype.float({ precision: 2, max: 100, min: 0 }),
        };

        return generated;
    }
}