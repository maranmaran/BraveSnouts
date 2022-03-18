
export interface MailVariables {
    [key: string]: MailVariable
}

export interface MailVariable {
    message: string;
    show: boolean;
}

export class SettingsService {
    private readonly _store: FirebaseFirestore.Firestore
    private _mailVariables: {
        [key: string]: string
    } = {};

    constructor(store: FirebaseFirestore.Firestore) {
        this._store = store;
    }

    async getMailVariables() {
        const doc = this._store.doc("config/mail-variables");
        const res = await doc.get();
        const dbVariables = res.data() as MailVariables;

        for (const variable in dbVariables) {
            if (!dbVariables[variable].show) {
                continue;
            }

            this._mailVariables[variable] = dbVariables[variable].message
        }

        return this._mailVariables;
    }
}