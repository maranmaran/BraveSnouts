import * as fs from "fs";
import * as handlebars from "handlebars";
import * as path from "path";
import { config } from "..";
import mjml2html = require("mjml");
const MailComposer = require("nodemailer/lib/mail-composer");

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

export function getTemplate(name: string, variables: any) {
    const handoverDetailsTemplate = mjml2html(
        fs.readFileSync(
            path.join(process.cwd(), "mail-templates", name),
            "utf8"
        ),
        {}
    );

    const emailTemplatePrecompiled = handlebars.compile(
        handoverDetailsTemplate.html
    );

    const emailTemplate = emailTemplatePrecompiled(variables);

    return emailTemplate;
}


export const getEmailOptoutLink = (optout: string) =>
    `${config.base.url}/email-optout;optout=${optout}`;

export const getPostConfirmUrl = (
    userId: string,
    totalDonation: string,
    paymentDetail: string,
    postageFee: number,
    auctionIds: string[]
) => {
    let ids = auctionIds.join(",");
    return `${config.base.url}/post-confirm;auctionIds=${ids};userId=${userId};donation=${totalDonation};paymentDetails=${paymentDetail};postageFee=${postageFee}`;
};

export const getHandoverConfirmUrl = (userId: string, auctionIds: string[]) => {
    let ids = auctionIds.join(",");
    return `${config.base.url}/handover-confirm;auctionIds=${ids};userId=${userId}`;
};
