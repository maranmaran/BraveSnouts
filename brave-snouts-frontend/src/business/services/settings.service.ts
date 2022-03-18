import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { first, map, shareReplay } from "rxjs/operators";

export interface GlobalSettings {
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

@Injectable({ providedIn: 'root' })
export class SettingsService {

    settings$ = this.get();
    imageProcessingSettings$ = this.getImageProcessingSettings();

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }


    private get() {
        return this.firestore.doc<GlobalSettings>('config/global').valueChanges().pipe(first(), shareReplay(1));
    }


    private getImageProcessingSettings() {
        return this.firestore.doc<ImageProcessingSettings>('config/image-processing').valueChanges().pipe(first(), shareReplay(1));
    }


    async getMailVariables() {
        return this.firestore.doc<MailVariables>("config/mail-variables").valueChanges().pipe(
            map(variables => {
                const activeVariables = {};

                for (const entry of Object.entries(variables)) {
                    if (!entry[1].show) {
                        continue;
                    }

                    activeVariables[entry[0]] = entry[1].message
                }
            })
        );
    }

}