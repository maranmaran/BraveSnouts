import { inject, Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { first, map, shareReplay } from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class SettingsService {

    private readonly firestore = inject(AngularFirestore);

    settings$ = this.get();
    imageProcessingSettings$ = this.getImageProcessingSettings();

    private get() {
        return this.firestore.doc<GlobalSettings>('config/global').valueChanges().pipe(first(), shareReplay(1));
    }


    private getImageProcessingSettings() {
        if (!this.firestore) {
            return;
        }

        return this.firestore.doc<ImageProcessingSettings>('config/image-processing').valueChanges().pipe(first(), shareReplay(1));
    }


    getMailVariables() {
        return this.firestore.doc<MailVariables>("config/mail-variables").valueChanges().pipe(
            map(variables => {
                const activeVariables = {};

                for (const entry of Object.entries(variables)) {
                    if (!entry[1].show) {
                        continue;
                    }

                    activeVariables[entry[0]] = entry[1].message
                }

                return activeVariables;
            })
        );
    }

    getAccounts() {
        return this.firestore.doc<BankAccountSettings>("config/bank-accounts")
            .valueChanges()
            .pipe(
                map(variables => {
                    const accounts = Array.from(Object.entries(variables));
                    const visibleAccounts = accounts.filter(x => x[1].visible).map(x => x[1]);
                    const sortedAccounts = visibleAccounts.sort((a, b) => a.type >= b.type ? 1 : -1);
                    return sortedAccounts as BankAccount[];
                })
            );
    }
}


export interface GlobalSettings {
    eurRate: number;
    gradualImageLoading: boolean;
    testing: {
        email: string;
        itemsCount: number;
    }
}

export interface MailVariables {
    [key: string]: MailVariable
}

export interface MailVariable {
    message: string;
    show: boolean;
}

export interface ImageProcessingSettings {
    compress: boolean;
    compressQuality: number;
    compressResizeHeight: number;
    compressResizeWidth: number;
    compressMethod: string;
    compressExtension: string;
}

export interface BankAccount {
    visible: boolean;
    type: string;
    account: string;
    image: string;
}

export interface BankAccountSettings {
    [key: string]: BankAccount;
}
