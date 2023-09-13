import { sortBy } from 'lodash';
import { appStore } from '../../app';

interface PostageRule {
    postage: number;
    lower: number;
}

export async function calculatePostage(itemsWonCount: number) {
    const docs = (await appStore.collection("config/postage-calculation/rules").get()).docs;

    let rules = docs.map(x => x.data()) as PostageRule[];
    rules = sortBy(rules, x => x.lower);

    let postageFee = 3;
    for (const rule of rules) {
        if (itemsWonCount >= rule.lower) {
            postageFee = rule.postage;
        }
    }

    return postageFee;
}