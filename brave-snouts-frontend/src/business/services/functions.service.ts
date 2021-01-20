
import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({ providedIn: 'root' })
export class FunctionsService {

    constructor(private functions: AngularFireFunctions) { }

    /** @deprecated */
    compressImage(file: File) {
        const callable = this.functions.httpsCallable('compressImage');
        
        return callable({ file });
    }

    /** Calls cloud function to process auction end */
    endAuction(auctionId: string) {
        const callable = this.functions.httpsCallable('endAuction-endAuctionFn');
        
        return callable({ auctionId });
    }
}