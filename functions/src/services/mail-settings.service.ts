import { logger } from 'firebase-functions';

export interface MailVariables {
    [key: string]: MailVariable
}

export interface MailVariable {
    message: string;
    show: boolean;
}

export class MailSettingsService {
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

        for (const entry of Object.entries(dbVariables)) {
            console.log(entry);

            if (!entry[1].show) {
                continue;
            }

            this._mailVariables[entry[0]] = entry[1].message
        }

        logger.log(this._mailVariables);

        return this._mailVariables;
    }
}