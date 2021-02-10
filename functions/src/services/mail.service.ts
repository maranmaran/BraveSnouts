import { logger } from "firebase-functions";
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { config } from "..";
import { AuctionItem, Bid, UserInfo, Auction } from "../models/models";
import Mail = require("nodemailer/lib/mailer");
import mjml2html = require("mjml");


//#region Mail service
let mailOpts = {};

// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = config.gmail?.user;
const gmailPassword = config.gmail?.password;

// PROD
if(gmailEmail && gmailPassword) {
  
  mailOpts = {
    service: 'Gmail',
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
    }
  };

}

const mailSvc = nodemailer.createTransport(mailOpts);
//#endregion

//#region Links

//item;auctionId=auctionActive100;itemId=0497a875-0839-4d7d-84dc-470d5f829e10
//email-optout;userId=ERra2BpsIiWPpOqCcCIiU4iDVRH3;optout=bidchange

const getEmailOptoutLink = (userId: string, optout: string) => `${config.base.url}/email-optout;userId=${userId};optout=${optout}`
//#endregion

/**Sends auction end mail */
export const sendEndAuctionMail = async (auction: Auction, handoverDetails: string, user: UserInfo, items: Bid[]) => {

  logger.info(`Sending mail to ${user.email} as he won ${items.length} items!`);

  // load and customize html template
  const emailVariables = {
    post_confirm_url: `${config.base.url}/post-confirm;auctionId=${auction.id};userId=${user.id}`,
    handover_confirm_url: `${config.base.url}/handover-confirm;auctionId=${auction.id};userId=${user.id}`,
    user_name: user.name.trim().split(" ")[0],
    handover_details: handoverDetails,
    payment_detail: `${auction.name} - ${user.email}`,
    items_html: `<ul>${items.map(item => `<li>${item.item.name} - ${item.value}kn</li>`).join("\n")}</ul>`,
    total: items.map(x => x.value).reduce((prev, cur) => prev + cur),
  }
  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'end-auction.mail.html'), 'utf8');
  var endAuctionTemplate = mjml2html(fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'end-auction.mail.mjml'), 'utf8'), { });
  let emailTemplatePrecompiled = handlebars.compile(endAuctionTemplate.html)
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

  await mailSvc.sendMail(email);
}

/**Sends outbidded mail */
export const sendOutbiddedMail = async (user: UserInfo, itemBefore: AuctionItem, itemAfter: AuctionItem) => {

  logger.info(`Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}-${itemBefore.bid} kn to ${itemAfter.bid} kn!`);

  // load and customize html template
  const emailVariables = {
    optout_url: getEmailOptoutLink(user.id, "bidchange"),
    item_url: `${config.base.url}/item;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
    item_name: itemAfter.name,
    item_bid_before: itemBefore.bid,
    item_bid_after: itemAfter.bid,
    user_name: user.name.trim().split(" ")[0]
  }
  
  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'outbidded.mail.html'), 'utf8');
  var outbiddedTemplate = mjml2html(fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'outbidded.mail.mjml'), 'utf8'), { });
  let emailTemplatePrecompiled = handlebars.compile(outbiddedTemplate.html)
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

/**Sends new handover details mail */
export const sendHandoverDetailsUpdateMail = async (user: UserInfo, handoverDetails: string) => {
  logger.info(`Sending mail to ${user.email} for handover details update`);

  
  // load and customize html template
  const emailVariables = {
    handover_details: handoverDetails,
    user_name: user.name.trim().split(" ")[0]
  }
  
  // const rawTemplate = fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.html'), 'utf8');
  var handoverDetailsTemplate = mjml2html(fs.readFileSync(path.join(process.cwd(), 'mail-templates', 'new-handover.mail.mjml'), 'utf8'), { });
  let emailTemplatePrecompiled = handlebars.compile(handoverDetailsTemplate.html)
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