import { logger } from "firebase-functions";
import * as fs from "fs";
import * as handlebars from "handlebars";
import * as nodemailer from "nodemailer";
import * as path from "path";
import { config } from "..";
import { Auction, AuctionItem, Bid, UserInfo } from "../models/models";
import { User } from "./../models/models";
import Mail = require("nodemailer/lib/mailer");
import mjml2html = require("mjml");

//#region Mail service
let mailOpts = {};

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = config.gmail?.user;
const gmailPassword = config.gmail?.password;

// PROD
if (gmailEmail && gmailPassword) {
  mailOpts = {
    service: "Gmail",
    pool: true,
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  };
}
// DEV
else {
  mailOpts = {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.mail?.user,
      pass: config.mail?.password,
    },
  };
}

const mailSvc = nodemailer.createTransport(mailOpts);
//#endregion

//#region Links

const getEmailOptoutLink = (userId: string, optout: string) =>
  `${config.base.url}/email-optout;userId=${userId};optout=${optout}`;

const getPostConfirmUrl = (
  userId: string,
  totalDonation: string,
  paymentDetail: string,
  postageFee: number,
  auctionIds: string[]
) => {
  let ids = auctionIds.join(",");
  return `${config.base.url}/post-confirm;auctionIds=${ids};userId=${userId};donation=${totalDonation};paymentDetails=${paymentDetail};postageFee=${postageFee}`;
};

const getHandoverConfirmUrl = (userId: string, auctionIds: string[]) => {
  let ids = auctionIds.join(",");
  return `${config.base.url}/handover-confirm;auctionIds=${ids};userId=${userId}`;
};

//#endregion

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
  const postageFee = 20; // TODO: Put in config

  // TODO: Remove after book auction
  // const totalItems = items.length;
  // if (totalItems == 1) {
  //   postageFee = 15;
  // }
  // if (totalItems >= 2 && totalItems <= 5) {
  //   postageFee = 25;
  // }
  // if (totalItems >= 5 && totalItems <= 10) {
  //   postageFee = 35;
  // }
  // if (totalItems > 10) {
  //   postageFee = 45;
  // }

  const paymentDetail = `${user.name}`;

  const emailVariables = {
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
    handover_details: `<ul>${handoverDetails
      .map((detail) => `<li>${detail}</li>`)
      .join("\n")}</ul>`,
    payment_detail: paymentDetail,
    items_html: `<ul>${items
      .map((item) => `<li>${item.item.name} - ${item.value}kn</li>`)
      .join("\n")}</ul>`,
    total: totalDonation,
    postage_fee: postageFee,
  };
  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'end-auction.mail.html'), 'utf8');
  let endAuctionTemplate = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "end-auction.mail.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(endAuctionTemplate.html);
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  // send it
  const email: Mail.Options = {
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: "Čestitamo na osvojenim predmetima!",
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
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
    optout_url: getEmailOptoutLink(user.id, "bidchange"),
    item_url: `${config.base.url}/item;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
    item_name: itemAfter.name,
    item_bid_before: itemBefore.bid,
    item_bid_after: itemAfter.bid,
    user_name: user.name.trim().split(" ")[0],
  };

  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'outbidded.mail.html'), 'utf8');
  let outbiddedTemplate = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "outbidded.mail.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(outbiddedTemplate.html);
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`,
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
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

  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.html'), 'utf8');
  let handoverDetailsTemplate = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "new-handover.mail.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(
    handoverDetailsTemplate.html
  );
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: "Promjena informacija za osobno preuzimanje!",
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
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

  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.html'), 'utf8');
  let handoverDetailsTemplate = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "handover-confirm.mail.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(
    handoverDetailsTemplate.html
  );
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: "[Osobno preuzimanje] Potvrda",
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
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
    // post_confirm_url: `${config.base.url}/post-confirm;auctionId=${auctionId};userId=${user.id};donation=${totalDonation};paymentDetails=${paymentDetail}`,
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

  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.html'), 'utf8');
  let handoverDetailsTemplate = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "post-confirm.mail.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(
    handoverDetailsTemplate.html
  );
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: "[Preuzimanje poštom] Potvrda",
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
};

/** Sends mail informing that new auction items were added to the auction */
export const sendNewItemsAddedMail = async (user: User, auction: Auction) => {
  logger.info(
    `Sending mail to ${user.email} to inform new items have been added to auction`
  );

  // load and customize html template
  const emailVariables = {
    user_name: user.displayName.trim().split(" ")[0],
    auction_name: auction.name,
    auction_url: `${config.base.url}/auction;id=${auction.id}`,
    optout_url: getEmailOptoutLink(user.id, "auctionannouncements"),
  };

  let template = mjml2html(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "mail-templates",
        "items-added-announcement.mjml"
      ),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(template.html);
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: "Novi predmeti u aukciji!",
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
};

/** Sends mail informing that auction is ending soon */
export const sendAuctionAnnouncementMail = async (
  user: User,
  auction: Auction,
  subject: string,
  message: string
) => {
  logger.info(
    `Sending mail to ${user.email} to inform that auction is ending soon`
  );

  // load and customize html template
  const emailVariables = {
    user_name: user.displayName,
    auction_name: auction.name,
    announce_message: message,
    auction_url: `${config.base.url}/auction;id=${auction.id}`,
    optout_url: getEmailOptoutLink(user.id, "auctionannouncements"),
  };

  let template = mjml2html(
    fs.readFileSync(
      path.join(process.cwd(), "mail-templates", "auction-announcement.mjml"),
      "utf8"
    ),
    {}
  );
  let emailTemplatePrecompiled = handlebars.compile(template.html);
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject,
    html: emailTemplate,
    attachments: [
      {
        filename: "njuske-original-compressed.jpg",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.jpg"
        ),
        cid: "logo",
      },
    ],
  };

  await mailSvc.sendMail(email);
};
