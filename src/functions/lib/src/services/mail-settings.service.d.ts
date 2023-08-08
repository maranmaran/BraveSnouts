export interface MailVariables {
    [key: string]: MailVariable;
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
export declare class MailSettingsService {
    private readonly _store;
    private _mailVariables;
    constructor(store: FirebaseFirestore.Firestore);
    getMailVariables(): Promise<{
        [key: string]: string;
    }>;
    getBankAccounts(): Promise<BankAccount[]>;
    formatBankAccounts(bankAccounts: BankAccount[]): string;
}
