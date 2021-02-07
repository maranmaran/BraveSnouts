import { logger } from "firebase-functions";
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { config } from "..";
import { AuctionItem, Bid, UserInfo, Auction } from "../models/models";
import Mail = require("nodemailer/lib/mailer");

// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
// const gmailEmail = functions.config().gmail?.email ?? 'urh.marko@gmail.com';
// const gmailPassword = functions.config().gmail?.password ?? 'urhmarko1295';
// const mailService = nodem  ailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: gmailEmail,
//     pass: gmailPassword,
//   },
// });

const getEmailOptoutLink = (userId: string, optout: string) => `${config.base.url}/email-optout;userId=${userId};optout=${optout}`

export const sendEndAuctionMail = async (auction: Auction, handoverDetails: string, user: UserInfo, items: Bid[]) => {

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

  // load and customize html template
  const emailVariables = {
    post_confirm_url: `${config.baseURL}/post-confirm;auctionId=${auction.id};userId=${user.id}`,
    handover_confirm_url: `${config.baseURL}/handover-confirm;auctionId=${auction.id};userId=${user.id}`,
    user_name: user.name.trim().split(" ")[0],
    handover_details: handoverDetails,
    payment_detail: `${auction.name} - ${user.email}`,
    items_html: `<ul>${items.map(item => `<li>${item.item.name} - ${item.value}kn</li>`).join("\n")}</ul>`,
    total: items.map(x => x.value).reduce((prev, cur) => prev + cur),
  }
  const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'end-auction.mail.html'), 'utf8');
  let emailTemplatePrecompiled = handlebars.compile(rawTemplate)
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  // send it
  const email: Mail.Options = {
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: 'Čestitamo na osvojenim predmetima!',
    html: emailTemplate,
    attachments: [{
      filename: 'njuske-kapica-compressed.jpg',
      path: path.join(process.cwd(), 'assets', 'njuske-kapica-compressed.jpg'),
      cid: 'logo' 
    }]
  };

  await testMailService.sendMail(email);
}

export const sendOutbiddedMail = async (user: UserInfo, itemBefore: AuctionItem, itemAfter: AuctionItem) => {

  logger.info(`Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}-${itemBefore.bid} kn to ${itemAfter.bid} kn!`);

  const mailSvc = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.mail.user,
      pass: config.mail.password,
    },
  });

  // load and customize html template
  const emailVariables = {
    optout_url: getEmailOptoutLink(user.id, "bidchange"),
    item_url: `${config.base.url}/auction;id=${itemAfter.auctionId}`,
    item_name: itemAfter.name,
    item_bid_before: itemBefore.bid,
    item_bid_after: itemAfter.bid,
    user_name: user.name.trim().split(" ")[0]
  }
  
  const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'outbidded.mail.html'), 'utf8');
  let emailTemplatePrecompiled = handlebars.compile(rawTemplate)
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`,
    html: emailTemplate,
    attachments: [{
      filename: 'njuske-kapica-compressed.jpg',
      path: path.join(process.cwd(), 'assets', 'njuske-kapica-compressed.jpg'),
      cid: 'logo' 
    }]
  };

  await mailSvc.sendMail(email);
}

export const sendHandoverDetailsUpdateMail = async (user: UserInfo, handoverDetails: string) => {
  logger.info(`Sending mail to ${user.email} for handover details update`);

  const mailSvc = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.mail.user,
      pass: config.mail.password,
    },
  });

  
  // load and customize html template
  const emailVariables = {
    handover_details: handoverDetails,
    user_name: user.name.trim().split(" ")[0]
  }
  
  const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.html'), 'utf8');
  let emailTemplatePrecompiled = handlebars.compile(rawTemplate)
  const emailTemplate = emailTemplatePrecompiled(emailVariables);

  const email = {
    // from: '"Hrabre njupke" <noreply.hrabrenjuske@gmail.com>',
    from: '"Hrabre njuške" <noreply.hrabrenjuške@gmail.com>',
    to: user.email,
    subject: 'Promjena informacija za osobno preuzimanje!',
    html: emailTemplate,
    attachments: [{
      filename: 'njuske-kapica-compressed.jpg',
      path: path.join(process.cwd(), 'assets', 'njuske-kapica-compressed.jpg'),
      cid: 'logo' 
    }]
  };

  await mailSvc.sendMail(email);
}