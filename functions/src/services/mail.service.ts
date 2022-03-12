import { logger } from "firebase-functions";
import * as nodemailer from "nodemailer";
import { config } from "..";
import { Auction, AuctionItem, Bid, User, UserInfo } from "../models/models";
import { getComposer, getEmailOptoutLink, getHandoverConfirmUrl, getPostConfirmUrl, getTemplate } from "./mail-content.service";
import { calculatePostage } from "./postage-calculator.service";
const mailgun = require("mailgun-js");

//#region Mail service

const getService = () => {
  switch (config.mail.provider) {
    case 'mailgun':
      return mailgun({ apiKey: config.mailgun?.apikey, domain: config.mailgun?.domain, host: "api.eu.mailgun.net" });
    case 'gmail':
      return nodemailer.createTransport({
        service: "Gmail",
        pool: true,
        auth: {
          user: config.gmail?.user,
          pass: config.gmail?.password,
        },
      });
    case 'ethereal':
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.ethereal?.user,
          pass: config.ethereal?.password,
        },
      });
  }
};

const sendMail = async composer => {
  const message = (await composer.compile().build()).toString('ascii');

  switch (config.mail.provider) {
    case 'mailgun':
      return await getService().messages().sendMime({ to: composer.mail.to, 'h:Reply-To': 'app.hrabrenjuske@gmail.com', message })
    case 'gmail':
    case 'ethereal':
      return await getService().sendMail(message)
  }
}

//#endregion

//#region Functions and mails - business logic

export class WinnerMailOptions {
  extraPostageMessage: string = "";
  extraMessage: string = "";
}

/**Sends auction end mail */
export const sendEndAuctionMail = async (
  auctions: Auction[],
  handoverDetails: string[],
  user: UserInfo,
  items: Bid[]
) => {
  logger.info(`Sending mail to ${user.email} as he won ${items.length} items!`);

  // load and customize html template
  const totalDonation = items
    .map((x) => x.value)
    .reduce((prev, cur) => prev + cur);

  const postageFee = await calculatePostage(items.length) ?? 20;

  const postage_details = `U slučaju preuzimanja poštom potrebno je uplatiti dodatnih ${postageFee} kn radi poštarine.`

  const paymentDetail = `${user.name}`;

  const customStoreParams = {};

  let emailVariables = {
    post_confirm_url: getPostConfirmUrl(
      user.id,
      totalDonation.toString(),
      paymentDetail,
      postageFee,
      auctions.map((x) => x.id)
    ),
    handover_confirm_url: getHandoverConfirmUrl(
      user.id,
      auctions.map((x) => x.id)
    ),
    user_name: user.name.trim().split(" ")[0],
    postage_details,
    postage_remark: '',
    handover_details: `<ul>${handoverDetails
      .map((detail) => `<li>${detail}</li>`)
      .join("\n")}</ul>`,
    payment_detail: paymentDetail,
    items_html: `<ul>${items
      .map((item) => `<li>${item.item.name} - ${item.value}kn</li>`)
      .join("\n")}</ul>`,
    total: totalDonation,
    postage_fee: postageFee,
    ...customStoreParams
  };

  const template = getTemplate("end-auction.mail.mjml", emailVariables);

  const composer = getComposer(user.email, "Čestitamo na osvojenim predmetima!", template);

  const res = await sendMail(composer);
  console.debug(res);
};

/**Sends outbidded mail */
export const sendOutbiddedMail = async (
  user: UserInfo,
  itemBefore: AuctionItem,
  itemAfter: AuctionItem
) => {
  logger.info(
    `Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}(${itemBefore.bidId}) from ${itemBefore.bid} kn to ${itemAfter.bid} kn!`
  );

  // load and customize html template
  const emailVariables = {
    optout_url: getEmailOptoutLink("bidchange"),
    item_url: `${config.base.url}/item;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
    item_name: itemAfter.name,
    item_bid_before: itemBefore.bid,
    item_bid_after: itemAfter.bid,
    user_name: user.name.trim().split(" ")[0],
  };

  const template = getTemplate("outbidded.mail.mjml", emailVariables);

  const composer = getComposer(user.email, `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`, template);

  const res = await sendMail(composer);
  console.debug(res);
};

/**Sends new handover details mail */
export const sendHandoverDetailsUpdateMail = async (
  user: UserInfo,
  auctionIds: string[],
  handoverDetails: string[]
) => {
  logger.info(`Sending mail to ${user.email} for handover details update`);

  // load and customize html template
  const emailVariables = {
    handover_details: `<ul>${handoverDetails
      .map((detail) => `<li>${detail}</li>`)
      .join("\n")}</ul>`,
    // handover_confirm_url: `${config.base.url}/handover-confirm;auctionId=${auctionId};userId=${user.id}`,
    handover_confirm_url: getHandoverConfirmUrl(user.id, auctionIds),
    user_name: user.name.trim().split(" ")[0],
  };

  const template = getTemplate("new-handover.mail.mjml", emailVariables);

  // send it
  const composer = getComposer(user.email, "Promjena informacija za osobno preuzimanje!", template);

  const res = await sendMail(composer);
  console.debug(res);
};

/**Sends new handover details mail */
export const sendHandoverConfirmationMail = async (
  user: User,
  auctionIds: string[],
  chosenHandoverOption: string
) => {
  logger.info(
    `Sending mail to ${user.email} for chosen handover option update`
  );

  // load and customize html template
  const emailVariables = {
    // handover_confirm_url: `${config.base.url}/handover-confirm;auctionId=${auctionId};userId=${user.id}`,
    handover_confirm_url: getHandoverConfirmUrl(user.id, auctionIds),
    user_name: user.displayName.trim().split(" ")[0],
    chosen_handover_option: chosenHandoverOption,
  };

  const template = getTemplate("handover-confirm.mail.mjml", emailVariables);

  // send it
  const composer = getComposer(user.email, "[Osobno preuzimanje] Potvrda", template);

  const res = await sendMail(composer);
  console.debug(res);
};

/**Sends new handover details mail */
export const sendPostConfirmationMail = async (
  user: User,
  auctionIds: string[],
  postFormData: any,
  totalDonation: string,
  paymentDetail: string,
  postageFee: number
) => {
  logger.info(`Sending mail to ${user.email} for chosen post option confirm`);

  // load and customize html template
  const emailVariables = {
    post_confirm_url: getPostConfirmUrl(
      user.id,
      totalDonation,
      paymentDetail,
      postageFee,
      auctionIds
    ),
    user_name: user.displayName.trim().split(" ")[0],
    full_name: postFormData.fullName,
    address: postFormData.address,
    phone: postFormData.phoneNumber,
  };

  const template = getTemplate("post-confirm.mail.mjml", emailVariables);

  const composer = getComposer(user.email, "[Preuzimanje poštom] Potvrda", template);

  const res = await sendMail(composer);
  console.debug(res);
};

//#endregion
