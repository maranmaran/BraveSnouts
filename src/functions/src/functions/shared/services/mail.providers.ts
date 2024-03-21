import { logger } from 'firebase-functions';
import { appConfig } from "../../app";

import * as fs from 'fs';
import * as nodemailer from "nodemailer";
import * as path from 'path';

import handlebars = require("handlebars");
import mjml2html = require("mjml");
import Mail = require('nodemailer/lib/mailer');
import SMTPPool = require('nodemailer/lib/smtp-pool');
import SMTPTransport = require('nodemailer/lib/smtp-transport');

const mailgun = require('mailgun.js');
const formData = require('form-data');
const mailComposer = require("nodemailer/lib/mail-composer");

export class MailBody {
    html: string;

    constructor(value: string) {
        this.html = value;
    }

}

export class MailBodyFactory {
    private mjml: string;
    private templateName: string;
    private mailVariables: any;

    constructor(templateName: string, variables: any) {
        this.templateName = templateName;
        this.mailVariables = variables;

        logger.log(`Template factory for ${name} with variables ${this.mailVariables}`);
    }

    /**
     * Creates mail template
     * @param template name of the template, templates are delivered as part of assets (on file system)
     * @param variables object of mailing variables to be replaced in template (MJML language)
     */
    async build(): Promise<MailBody> {
        await this.readMJMLTemplate();

        return new MailBody(
            this.compileMJMLTemplate()
        );
    }

    private compileMJMLTemplate() {
        const html = mjml2html(this.mjml, {}).html;
        return handlebars.compile(html)(this.mailVariables);
    }

    /**
     * Reads downloaded MJML template in raw format
     */
    private async readMJMLTemplate(): Promise<string> {
        const fsPath = path.join(process.cwd(), "mail-templates");
        const fsPathFull = path.join(fsPath, this.templateName);
        return fs.readFileSync(fsPathFull, "utf8");;
    }
}

export class MailProviderFactory {
    create(provider: string): MailProvider {
        switch (provider) {
            case 'mailgun':
                return new MailgunMailProvider();
            case 'gmail':
                return new GmailMailProvider();
            case 'ethereal':
                return new EtheralMailProvider();
            default:
                throw new Error("No configured mail provider, check your firebase functions:config:get");
        }
    }
}

export abstract class MailProvider {
    /**
     * Sends email
     * @param to Who you are sending to
     * @param subject Title
     * @param body HTML 
     */
    public async sendMail(to: string, subject: string, body: MailBody): Promise<void> {
        try {
            const message = await this.composeMessage(to, subject, body);
            await this.send(to, subject, message);
        } catch (err) {
            logger.error(JSON.stringify(err), { err });
        }
    }

    protected abstract send(to: string, subject: string, message: string): Promise<void>;

    protected async composeMessage(to: string, subject: string, body: MailBody): Promise<string> {
        const composer = new mailComposer({
            from: 'Hrabre Njuške <aukcija@hrabrenjuske.hr>',
            to,
            subject,
            html: body.html,
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

        return (await composer.compile().build()).toString('ascii');
    }
}

export class GmailMailProvider extends MailProvider {
    private client: any;

    constructor() {
        super();
        this.client = nodemailer.createTransport({
            service: "Gmail",
            pool: true,
            auth: {
                user: appConfig().gmail?.user,
                pass: appConfig().gmail?.password,
            },
        });
    }

    protected async send(to: string, subject: string, message: string): Promise<void> {
        return await this.client.sendMail(message)
    }
}

export class MailgunMailProvider extends MailProvider {
    private client: any;

    constructor() {
        super();
        this.client = new mailgun(formData).client({
            username: 'api',
            key: appConfig().mailgun?.apikey,
            url: "https://api.eu.mailgun.net"
        });
    }

    protected async send(to: string, subject: string, message: string): Promise<void> {
        const domain = appConfig().mailgun?.domain;

        return await this.client.messages
            .create(domain, {
                to,
                message,
                'h:Reply-To': 'app.hrabrenjuske@gmail.com',
            })
    }

}

export class EtheralMailProvider extends MailProvider {
    private client: any;

    constructor() {
        super();
        this.client = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: appConfig().ethereal?.user,
                pass: appConfig().ethereal?.password,
            },
        })
    }

    protected async send(to: string, subject: string, message: string): Promise<void> {
        return await this.client.sendMail(message)
    }
}
