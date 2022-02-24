import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { first, shareReplay } from "rxjs/operators";

export interface GlobalSettings {
    gradualImageLoading: boolean;
}

@Injectable({ providedIn: 'root' })
export class GlobalSettingsService {

    settings$ = this.get();

    constructor(
        private readonly firestore: AngularFirestore
    ) {
    }


    private get() {
        return this.firestore.doc<GlobalSettings>('config/global').valueChanges().pipe(first(), shareReplay(1));
    }

}