import { logger } from "firebase-functions";
import { config, mailSettings } from "../../../app";
import { User, UserInfo } from "../../models/models";
import { getComposer, getTemplate, getTemplateRaw, sendMail } from './../mail.service';

const templateCache: string = null;
const getLocalTemplate = async () => templateCache ? templateCache : await getTemplateRaw("handover-confirm.mail.mjml");

/**Sends new handover details mail */
export const sendHandoverDetailsUpdateMail = async (
    user: UserInfo,
    auctionIds: string[],
    handoverDetails: string[]
) => {
    logger.info(`Sending mail to ${user.email} for handover details update`);

    const emailVariables = {
        handover_details: `<ul>${handoverDetails
            .map((detail) => `<li>${detail}</li>`)
            .join("\n")}</ul>`,
        handover_confirm_url: getHandoverConfirmUrl(user.id, auctionIds),
        user_name: user.name.trim().split(" ")[0],
        ...(await mailSettings.getMailVariables())
    };

    const templateRaw = await getTemplateRaw("new-handover.mail.mjml");
    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, "Promjena informacija za osobno preuzimanje!", template);
    const res = await sendMail(composer);
    logger.debug(res);
};

/**Sends new handover details mail */
export const sendHandoverConfirmationMail = async (
    user: User,
    auctionIds: string[],
    chosenHandoverOption: string
) => {
    logger.info(`Sending mail to ${user.email} for chosen handover option update`);

    // load and customize html template
    const emailVariables = {
        handover_confirm_url: getHandoverConfirmUrl(user.id, auctionIds),
        user_name: user.displayName.trim().split(" ")[0],
        chosen_handover_option: chosenHandoverOption,
        ...(await mailSettings.getMailVariables())
    };

    const templateRaw = await getLocalTemplate();
    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, "[Osobno preuzimanje] Potvrda", template);
    const res = await sendMail(composer);
    logger.debug(res);
};

export const getHandoverConfirmUrl = (userId: string, auctionIds: string[]) => {
    const ids = auctionIds.join(",");
    return `${config.base.url}/aukcije/potvrda-primopredaja;auctionIds=${ids};userId=${userId}`;
};
