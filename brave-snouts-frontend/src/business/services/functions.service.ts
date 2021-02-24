
import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable()
export class FunctionsService {

    constructor(private functions: AngularFireFunctions) { }

    /** @deprecated */
    compressImage(file: File) {
        const callable = this.functions.httpsCallable('compressImage');

        return callable({ file });
    }

    /** Calls cloud function to process auction end */
    endAuction(auctionId: string, handoverDetails: string) {
        const callable = this.functions.httpsCallable('endAuction-endAuctionFn');

        return callable({ auctionId, handoverDetails });
    }

    /** Sends email update for handover via cloud function */
    changeHandoverDetails(auctionId: string, handoverDetails: string) {
        const callable = this.functions.httpsCallable('changeHandover-changeHandoverFn');

        return callable({ auctionId, handoverDetails });
    }

    exportAuction(auctionId: string) {
      const callable = this.functions.httpsCallable('exportAuction-exportAuctionFn');

      return callable({ auctionId });
    }
}
