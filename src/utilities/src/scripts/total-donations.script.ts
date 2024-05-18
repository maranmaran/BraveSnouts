import { store } from "../base-setup";
import { Auction, Winner } from "../models";

(async () => {
    const auctions = (await store.collection('auctions').get()).docs.map(d => d.data()) as Auction[];

    const hrkAuctions = auctions.filter(x => x.startDate.toDate() <= new Date('01.01.2023'));
    console.log('CALCULATING FOR HRK')
    await calculateStats(hrkAuctions);
    console.log("====================")

    const eurAuctions = auctions.filter(x => x.startDate.toDate() > new Date('01.01.2023'));
    console.log('CALCULATING FOR EUR')
    await calculateStats(eurAuctions);
    console.log("====================")

})();


const calculateStats = async (auctions: Auction[]) => {

    const totalRaised = auctions
        .reduce((acc, cur) => acc += cur.raisedMoney, 0);

    console.log(`Total raised is ${totalRaised}`)

    let winners: Winner[] = [];
    for (const a of auctions) {
        const aWinners = (await store.collection(`auctions/${a.id}/winners`).get()).docs.map(d => d.data()) as Winner[];
        winners.push(...aWinners);
    }

    const winnerStats = new Map<WinnerId, WinnerStats>();
    for (const w of winners) {
        if (winnerStats.has(w.id)) {
            winnerStats.set(w.id, winnerStats.get(w.id).addToStats(w));
        } else {
            winnerStats.set(w.id, new WinnerStats().addToStats(w))
        }
    }

    const stats = [...winnerStats.values()];

    const sortedItemCounts = stats.sort((a, b) => a.itemCount < b.itemCount ? 1 : -1);
    for (let i = 0; i < 10; i++) {
        const mostItems = sortedItemCounts[i];
        console.log(`Top item winner is ${mostItems.winner.userInfo.name} with ${mostItems.itemCount} items won`)
    }

    const sortedTotalDonation = stats.sort((a, b) => a.totalDonation < b.totalDonation ? 1 : -1);
    for (let i = 0; i < 10; i++) {
        const mostDonation = sortedTotalDonation[i];
        console.log(`Top donation winner is ${mostDonation.winner.userInfo.name} with ${mostDonation.totalDonation} donation`)
    }

}


export type WinnerId = string;
export class WinnerStats {
    winner: Winner;
    itemCount: number = 0;
    totalDonation: number = 0;

    addToStats(w: Winner) {
        this.setWinner(w);
        this.itemCount += (w as any).items.length;
        this.totalDonation += ((w as any).items as any[]).map(x => x.bid as number).reduce((a, c) => a += c, 0)
        return this;
    }

    setWinner(w: Winner) {
        if (this.winner) return;
        this.winner = w;
    }
}