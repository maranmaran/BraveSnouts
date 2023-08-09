import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { PostConfirmFormData } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';

@Injectable()
export class FunctionsService {
  constructor(private functions: AngularFireFunctions) { }

  /** Calls cloud function to process auction end */
  endAuction(auctionId: string, handoverDetails: string[]) {
    const callable = this.functions.httpsCallable('auctions-endAuction');

    return callable({ auctionId, handoverDetails });
  }

  testSendWinnerMail(email, items) {
    const callable = this.functions.httpsCallable('auctions-testSendWinnerMail');

    return callable({ email, items });
  }

  /** Calls cloud function to send winner emails */
  sendWinnerMails(auctionIds: string[], handoverDetails: string[]) {
    const callable = this.functions.httpsCallable('auctions-sendWinnerMail');

    return callable({ auctionIds, handoverDetails });
  }

  /** Sends email update for handover via cloud function */
  changeHandoverDetails(auctionIds: string[], handoverDetails: string[]) {
    const callable = this.functions.httpsCallable('auctions-changeHandover');

    return callable({ auctionIds, handoverDetails });
  }

  exportAuction(auctionIds: string[], filename: string) {
    const callable = this.functions.httpsCallable('auctions-exportAuction');

    return callable({ auctionIds, filename });
  }

  sendPostConfirm(
    userId: string,
    auctionIds: string[],
    formData: PostConfirmFormData,
    totalDonation: number,
    paymentDetail: string,
    postageFee: number
  ) {
    const callable = this.functions.httpsCallable('auctions-handoverConfirm');

    return callable({
      userId,
      auctionIds,
      chosenOption: 'post',
      chosenOptionData: formData,
      totalDonation,
      paymentDetail,
      postageFee,
    });
  }

  sendHandoverConfirm(userId: string, auctionIds: string[], chosenOptionData: string) {
    const callable = this.functions.httpsCallable('auctions-handoverConfirm');

    return callable({
      userId,
      auctionIds,
      chosenOption: 'handover',
      chosenOptionData,
    });
  }

  sendNewItemsAddedMail(auctionId: string) {
    const callable = this.functions.httpsCallable('auctions-newItemsAdded');

    return callable({ auctionId });
  }

  downloadMails() {
    const callable = this.functions.httpsCallable('auctions-downloadMails');

    return callable({});
  }
}
