const mjml2html = require("mjml");
const fs = require("fs");
const handlebars = require("handlebars");
const mailgun = require("mailgun-js");
const MailComposer = require("nodemailer/lib/mail-composer");
const path = require("path");

// mailgun credentials
const creds = {
    domain: "testdomain",
    apiKey: "testkey"
};

// mail service instance
const mailService = mailgun({ apiKey: creds.apiKey, domain: creds.domain, host: "api.eu.mailgun.net", });

// mail variables
const emailVariables = {
    post_confirm_url: "test",
    handover_confirm_url: "test",
    user_name: "User",
    handover_details: `No details`,
    payment_detail: "No details",
    items_html: `No items`,
    total: 0,
    postage_fee: 0,
};

// html template
let endAuctionTemplate = mjml2html(
    fs.readFileSync(
        path.join(process.cwd(), "mail-templates", "end-auction.mail.mjml"),
        "utf8"
    ),
    {}
);

let emailTemplatePrecompiled = handlebars.compile(endAuctionTemplate.html);
const emailTemplate = emailTemplatePrecompiled(emailVariables);

// Compose mail
var mail = new MailComposer({
    from: 'Hrabre Njuške <aukcija@hrabrenjuske.hr>',
    to: `urh.marko@gmail.com`,
    subject: 'Aukcija zavrsena',
    html: emailTemplate,
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

(async () => {
    try {
        console.info("Sending");

        const message = (await mail.compile().build()).toString('ascii');
        const result = await mailService.messages().sendMime({ to: mail.mail.to, 'h:Reply-To': 'urh.marko@gmail.com', message })

        console.info("Sent");
        console.debug(result);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();