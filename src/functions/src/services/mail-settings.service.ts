import { logger } from 'firebase-functions';

export interface MailVariables {
    [key: string]: MailVariable
}

export interface MailVariable {
    message: string;
    show: boolean;
}


export interface BankAccount {
    name: string;
    account: string;
    visible: boolean;
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

        const bank_accounts = await this.getBankAccounts();

        this._mailVariables = {
            ...activeVariables,
            bank_accounts: this.formatBankAccounts(bank_accounts)
        };

        logger.log('Active mail variables (check your firestore for show: boolean field)', { mailVariables: this._mailVariables });

        return this._mailVariables;
    }

    async getBankAccounts() {
        const doc = this._store.doc("config/bank-accounts");
        const res = await doc.get();
        return Array.from(Object.values(res.data())) as BankAccount[];
    }

    formatBankAccounts(bankAccounts: BankAccount[]) {
        return `
            <ul>
                ${bankAccounts.filter(ba => ba.visible).map(ba => `<li>${ba.name} - ${ba.account}</li>`)}
            </ul>
        `;
    }
}