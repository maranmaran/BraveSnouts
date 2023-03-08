import { logger } from 'firebase-functions';
import { europeFunctions, store } from '../index';
import { User } from '../models/models';
import { sendHandoverConfirmationMail } from '../services/mail-factories/handover-information-mail.factory';
import { sendPostConfirmationMail } from '../services/mail-factories/post-information-mail.factory';
import { getComposer, sendMail } from '../services/mail.service';

/**
 * Confirms chosen handover option
 * Post or in person
 */
export const handoverConfirmFn = europeFunctions.https.onCall(
  async (data, context) => {


    try {
      const userId = data.userId;
      const auctionIds = data.auctionIds as string[];

      const chosenOption = data.chosenOption;
      const chosenOptionData = data.chosenOptionData;

      const totalDonation = data.totalDonation;
      const paymentDetail = data.paymentDetail;
      const postageFee = data.postageFee;

      // process auction// add to map
      const userDb = await (await store.doc(`users/${userId}`).get()).data() as User;

      if (chosenOption === 'handover') {
        await sendHandoverConfirmationMail(userDb, auctionIds, chosenOptionData);

        const adminUpdateMessage = `
            Korisnik <b>${userDb.displayName}</b> je potvrdio/la preuzimanje osobno - lokacija: <b>${chosenOptionData}</b>
            <br/><br/>
            Informacije:
            <br/><br/>
            Ime: ${userDb.displayName}
            <br/>
            Mail: ${userDb.email}
            <br/>
            Mobitel: ${userDb.phoneNumber}
        `;

        await sendMail(getComposer("app.hrabrenjuske@gmail.com", `${userDb.displayName} je odabrao preuzimanje osobno`, adminUpdateMessage));

        return { status: 200 };
      }

      if (chosenOption === 'post') {
        await sendPostConfirmationMail(userDb, auctionIds, chosenOptionData, totalDonation, paymentDetail, postageFee)

        const adminUpdateMessage = `
            Korisnik <b>${userDb.displayName}</b> je potvrdio/la preuzimanje poštom - lokacija: <b>${chosenOptionData.address}</b>
            <br/><br/>
            Informacije:
            <br/><br/>
            Ime: ${chosenOptionData.fullName}
            <br/>
            Adresa: ${chosenOptionData.address}
            <br/>
            Mobitel: ${chosenOptionData.phoneNumber}
            <br/>
            Mail: ${userDb.email}
        `;

        await sendMail(getComposer("app.hrabrenjuske@gmail.com", `${userDb.displayName} je odabrao preuzimanje poštom`, adminUpdateMessage));

        await sendPostConfirmationMail(userDb, auctionIds, chosenOptionData, totalDonation, paymentDetail, postageFee)
        return { status: 200 };
      }

      return { status: 400 };
    } catch (e) {
      logger.error(e);
      throw e;
    }


  }
);
