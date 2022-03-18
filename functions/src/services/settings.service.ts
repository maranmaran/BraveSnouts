
export class SettingsService {
    private readonly _store: FirebaseFirestore.Firestore
    private _mailVariables = {};

    constructor(store: FirebaseFirestore.Firestore) {
        this._store = store;
    }

    async getMailVariables() {
        const doc = this._store.doc("config/mail-variables");
        const res = await doc.get();
        this._mailVariables = res.data();

        return this._mailVariables;
    }
}