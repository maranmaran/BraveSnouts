export class CurrencyService {
    private readonly _store: FirebaseFirestore.Firestore

    constructor(store: FirebaseFirestore.Firestore) {
        this._store = store;
    }

    async getEurRate() {
        const doc = this._store.doc("config/global");
        const res = await doc.get();
        const dbVariables = res.data() as { eur: number };

        return dbVariables.eur;
    }

    async formatHrkAndEur(hrk: number) {

        const eurRate = await this.getEurRate();

        const eur = Math.round(100 * hrk / eurRate) / 100;

        return `${hrk} kn | ${eur} €`
    }
}