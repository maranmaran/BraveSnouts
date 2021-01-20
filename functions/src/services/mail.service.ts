import { logger } from "firebase-functions";
import * as nodemailer from 'nodemailer';
import { config, europeFunctions } from "..";
import { AuctionItem, Bid, UserInfo } from "../models/models";

// import * as functions from 'firebase-functions';

// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// const gmailEmail = functions.config().gmail?.email ?? 'urh.marko@gmail.com';
// const gmailPassword = functions.config().gmail?.password ?? 'urhmarko1295';
// const mailService = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: gmailEmail,
//     pass: gmailPassword,
//   },
// });

export const sendEndAuctionMail = async (user: UserInfo, items: Bid[]) => {

  logger.info(`Sending mail to ${user.email} as he won ${items.length} items!`);

  const testMailService = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.mail.user,
      pass: config.mail.password,
    },
  });

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Admin" <urh.marko@gmail.com>',
    to: user.email,
    subject: 'Osvojio si predmete na aukciji!',
    text: `Hvala ti na sudjelovanju. 
        Osvojio si ${items.length} predmeta. 
        Evo informacije kako platiti...`,
  };

  await testMailService.sendMail(email);
}

export const sendOutbiddedMail = async (user: UserInfo, itemBefore: AuctionItem, itemAfter: AuctionItem) => {

  logger.info(`Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}-${itemBefore.bid} kn to ${itemAfter.bid} kn!`);

  const testMailService = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.mail.user,
      pass: config.mail.password,
    },
  });

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Admin" <urh.marko@gmail.com>',
    to: user.email,
    subject: `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`,
    html: `
      <p>Pozdrav ${user.name},</p> 
      
      <p>Htjeli smo ti javiti da je tvoja ponuda za predmet <b>${itemBefore.name}"</b> 
      od <b>${itemBefore.bid} kn</b> nadmašena i trenutno iznosi <b>${itemAfter.bid} kn</b>.</p>
      
      <p>Predmet možeš pronaći na ovoj 
      <a href="https://brave-snouts-prod.firebaseapp.com/auction;id=${itemAfter.auctionId}">aukciji</a>.
      </p>`,
  };

  await testMailService.sendMail(email);
}