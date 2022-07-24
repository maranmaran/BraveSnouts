import { logger } from 'firebase-functions';
import moment = require("moment");

export class CurrencyService {
    private readonly _store: FirebaseFirestore.Firestore

    constructor(store: FirebaseFirestore.Firestore) {
        this._store = store;
    }

    private eurRate?: number = null;

    async getEurRate() {
        this.eurRate = await this.getFromDb();
        logger.info("EUR value fetched and stored in service" + " " + this.eurRate);
    }

    private async getFromDb() {
        const doc = this._store.doc("config/global");
        const res = await doc.get();
        const dbVariables = res.data() as { eur: number };

        return dbVariables.eur;
    }

    formatHrkAndEur(hrk: number) {
        if (!this.eurRate)
            throw new Error('Eur rate missing');

        const eur = Math.round(100 * hrk / this.eurRate) / 100;
        return `${hrk} kn | ${eur} €`
    }
}