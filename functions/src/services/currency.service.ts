import moment = require("moment");

interface EurRateCache {
    eurRate: number;
    time: Date;
}

export class CurrencyService {
    private readonly _store: FirebaseFirestore.Firestore

    constructor(store: FirebaseFirestore.Firestore) {
        this._store = store;
    }

    async getEurRate() {
        return await this.fetchEurRateInternal();
    }

    private async fetchEurRateInternal() {
        const eurRateCache = JSON.parse(localStorage.getItem('eurRate')) as EurRateCache;
        if (!eurRateCache) {
            return await this.getFromDb();
        }

        const start = moment(eurRateCache.time);
        const end = moment(new Date());
        const difference = moment.duration(end.diff(start));

        if (difference.hours() >= 4) {
            return await this.getFromDb();
        }

        return eurRateCache.eurRate;
    }

    private async getFromDb() {
        const doc = this._store.doc("config/global");
        const res = await doc.get();
        const dbVariables = res.data() as { eur: number };

        // preserve in local cache
        const cache = <EurRateCache>{ eurRate: dbVariables.eur, time: new Date() };
        localStorage.setItem('eurRate', JSON.stringify(cache));

        return dbVariables.eur;
    }

    async formatHrkAndEur(hrk: number) {
        const eurRate = await this.getEurRate();
        const eur = Math.round(100 * hrk / eurRate) / 100;
        return `${hrk} kn | ${eur} €`
    }
}