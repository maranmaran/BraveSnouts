import { logger } from "firebase-functions";
import { Auction, Bid, UserInfo } from "../../models/models";
import { getComposer, getTemplate, sendMail } from "../mail.service";
import { calculatePostage } from "../postage-calculator.service";
import { getHandoverConfirmUrl } from "./handover-information-mail.factory";
import { getPostConfirmUrl } from "./post-information-mail.factory";


/**Sends auction end mail */
export const sendWinnerMail = async (
    auctions: Auction[],
    handoverDetails: string[],
    user: UserInfo,
    items: Bid[],
    settingsMailVariables: any,
    templateRaw: any
) => {
    logger.info(`Sending mail to ${user.email} as he won ${items.length} items!`);

    const postageFee = await calculatePostage(items.length) ?? 20;
    const postage_details = `U slučaju preuzimanja poštom potrebno je uplatiti dodatnih ${postageFee} kn radi poštarine.`
    const paymentDetail = `${user.name}`;
    const totalDonation = items
        .map((x) => x.value)
        .reduce((prev, cur) => prev + cur);

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
        ...settingsMailVariables
    };

    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, "Čestitamo na osvojenim predmetima!", template);
    const res = await sendMail(composer);
    console.debug(res);
};

