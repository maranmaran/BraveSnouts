import { logger } from 'firebase-functions';
import { config } from "..";

import * as fs from 'fs';
import * as nodemailer from "nodemailer";
import * as path from 'path';

import handlebars = require("handlebars");
import mjml2html = require("mjml");

const mailgun = require('mailgun.js');
const formData = require('form-data');
const mailComposer = require("nodemailer/lib/mail-composer");

const client = (() => {
  console.log(config);

  switch (config?.mail?.provider) {
    case 'mailgun':
      return new mailgun(formData).client({
        username: 'api',
        key: config.mailgun?.apikey,
        url: "https://api.eu.mailgun.net"
      }) as any;
    case 'gmail':
      return nodemailer.createTransport({
        service: "Gmail",
        pool: true,
        auth: {
          user: config.gmail?.user,
          pass: config.gmail?.password,
        },
      }) as any;
    case 'ethereal':
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.ethereal?.user,
          pass: config.ethereal?.password,
        },
      }) as any;
    default:
      throw new Error("No configured mail provider, check your firebase functions:config:get");
  }
})();

export const sendMail = async composer => {

  try {
    const message = (await composer.compile().build()).toString('ascii');

    switch (config.mail.provider) {
      case 'mailgun':
        return await client.messages
          .create(
            config.mailgun?.domain, // domain
            { to: composer.mail.to, 'h:Reply-To': 'app.hrabrenjuske@gmail.com', message } // message data
          )
      case 'gmail':
      case 'ethereal':
        return await client.sendMail(message)
    }
  } catch (err) {
    logger.error(JSON.stringify(err), { err });
  }
}

export function getComposer(to: string, subject: string, html: string) {
  return new mailComposer({
    from: 'Hrabre Njuške <aukcija@hrabrenjuske.hr>',
    to,
    subject,
    html,
    attachments: [
      {
        filename: "njuske-original-compressed.png",
        path: path.join(
          process.cwd(),
          "assets",
          "njuske-original-compressed.png"
        ),
        cid: "logo.png",
      },
    ],
  });
}

export async function getTemplateRaw(name: string) {
  logger.log('Getting template ' + name);
  const mjmlFile = await getMjmlTemplate(name);
  logger.log('fetched raw template');
  return mjmlFile;
}

export async function getTemplate(mjml: any, variables: any) {

  const html = mjml2html(mjml, {}).html;
  const emailFactory = handlebars.compile(html);
  const template = emailFactory(variables);

  return template;
}

// Loads raw template from storage or file system (fallback)
async function getMjmlTemplate(name: string) {
  const fsPath = path.join(process.cwd(), "mail-templates");
  const fsPathFull = path.join(fsPath, name);

  return fs.readFileSync(fsPathFull, "utf8");;
}

export const getEmailOptoutLink = () =>
  `${config.base.url}/aukcije/email-postavke`;
