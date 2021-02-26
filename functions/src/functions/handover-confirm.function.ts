import { europeFunctions, store } from '../index';
import { User } from '../models/models';
import { sendHandoverConfirmationMail, sendPostConfirmationMail } from '../services/mail.service';

/**
 * Confirms chosen handover option
 * Post or in person
 */
export const handoverConfirmFn = europeFunctions.https.onCall(
    async (data, context) => {
  
      const userId = data.userId;
      const auctionId = data.auctionId;
      
      const chosenOption = data.chosenOption;
      const chosenOptionData = data.chosenOptionData;
      
      const totalDonation = data.totalDonation;
      const paymentDetail = data.paymentDetail;
  
      // process auction// add to map
      const userDb = await (await store.doc(`users/${userId}`).get()).data() as User;

      if(chosenOption === 'handover') {
        await sendHandoverConfirmationMail(userDb, auctionId, chosenOptionData);
        return { status: 200 };
      } 

      if(chosenOption === 'post') {
        await sendPostConfirmationMail(userDb, auctionId, chosenOptionData, totalDonation, paymentDetail)
        return { status: 200 };
      }

      return { status: 400 };

    }
  );
  