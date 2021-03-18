
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
    endAuction(auctionId: string, handoverDetails: string[]) {
        const callable = this.functions.httpsCallable('endAuction-endAuctionFn');

        return callable({ auctionId, handoverDetails });
    }

    /** Calls cloud function to send winner emails */
    sendWinnerMails(auctionIds: string[], handoverDetails: string[]) {
        const callable = this.functions.httpsCallable('sendWinnerMail-sendWinnerMailFn');

        return callable({ auctionIds, handoverDetails });
    }

    /** Sends email update for handover via cloud function */
    changeHandoverDetails(auctionIds: string[], handoverDetails: string[]) {
        const callable = this.functions.httpsCallable('changeHandover-changeHandoverFn');

        return callable({ auctionIds, handoverDetails });
    }

    exportAuction(auctionIds: string[]) {
      const callable = this.functions.httpsCallable('exportAuction-exportAuctionFn');

      return callable({ auctionIds });
    }

    processAuctionImages(auctionId: string, imageBucketPath: string) {
      const callable = this.functions.httpsCallable('processAuctionImages-processAuctionImagesFn');

      return callable({ auctionId, imageBucketPath });
    }

    sendPostConfirm(userId, auctionIds, formData, totalDonation, paymentDetail) {
      const callable = this.functions.httpsCallable('handoverConfirm-handoverConfirmFn');

      return callable({ userId, auctionIds, chosenOption: 'post', chosenOptionData: formData, totalDonation, paymentDetail });
    }

    sendHandoverConfirm(userId, auctionIds, chosenOptionData) {
      const callable = this.functions.httpsCallable('handoverConfirm-handoverConfirmFn');

      return callable({ userId, auctionIds, chosenOption: 'handover', chosenOptionData });
    }

    sendNewItemsAddedMail(auctionId) {
      const callable = this.functions.httpsCallable('newItemsAdded-newItemsAddedFn');

      return callable({ auctionId });
    }
}
