import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { first, shareReplay } from "rxjs/operators";

export interface GlobalSettings {
    gradualImageLoading: boolean;
    testing: {
        email: string;
        itemsCount: number;
    }
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
export class GlobalSettingsService {

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

}