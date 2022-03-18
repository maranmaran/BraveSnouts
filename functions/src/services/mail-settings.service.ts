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

        const activeVariables = {};

        for (const entry of Object.entries(dbVariables)) {
            if (!entry[1].show) {
                continue;
            }

            activeVariables[entry[0]] = entry[1].message
        }

        this._mailVariables = activeVariables;

        logger.log(this._mailVariables);

        return this._mailVariables;
    }
}