import { logger } from 'firebase-functions';
import * as fs from 'fs';
import * as nodemailer from "nodemailer";
import * as path from 'path';
import { config } from "..";
import handlebars = require("handlebars");
import mjml2html = require("mjml");
const mailgun = require("mailgun-js");
const MailComposer = require("nodemailer/lib/mail-composer");

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

export const sendMail = async composer => {
  const message = (await composer.compile().build()).toString('ascii');

  switch (config.mail.provider) {
    case 'mailgun':
      return await getService().messages().sendMime({ to: composer.mail.to, 'h:Reply-To': 'app.hrabrenjuske@gmail.com', message })
    case 'gmail':
    case 'ethereal':
      return await getService().sendMail(message)
  }
}

export function getComposer(to: string, subject: string, html: string) {
  return new MailComposer({
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
  console.log('fetched raw template');
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
  `${config.base.url}/email-postavke`;
