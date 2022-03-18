import { storage } from "firebase-admin";
import { logger } from 'firebase-functions';
import * as fs from 'fs';
import * as nodemailer from "nodemailer";
import * as os from 'os';
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


export async function getTemplate(name: string, variables: any) {

  logger.log('Getting template ' + name);

  const mjmlFile = await getMjmlTemplate(name);

  const html = mjml2html(mjmlFile, {}).html;
  const emailFactory = handlebars.compile(html);
  const template = emailFactory(variables);

  return template;
}

// Loads raw template from storage or file system (fallback)
async function getMjmlTemplate(name: string) {

  const fsPath = path.join(process.cwd(), "mail-templates");
  const fsPathFull = path.join(fsPath, name);

  const storagePath = path.join(os.tmpdir(), "storage-templates");
  const storagePathFull = path.join(storagePath, name);

  try {
    deleteFolderRecursive(storagePath);
    fs.mkdirSync(storagePath);

    const bucket = storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

    logger.log("Retrieving template from storage")

    const downloadRes = await bucket.file(`mail-templates/${name}`).download({ destination: storagePathFull });

    console.log(downloadRes);

    return downloadRes ? fs.readFileSync(storagePathFull, "utf8") : fs.readFileSync(fsPathFull, "utf8");
  } catch (err) {
    logger.error(err);
    logger.log("Retrieving template from file system");
    return fs.readFileSync(fsPathFull, "utf8");
  }

}

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};

export const getEmailOptoutLink = (optout: string) =>
  `${config.base.url}/email-optout;optout=${optout}`;
