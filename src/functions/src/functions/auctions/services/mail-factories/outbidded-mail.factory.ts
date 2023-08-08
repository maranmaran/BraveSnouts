import { logger } from "firebase-functions";
import { config, settingsSvc } from "../..";
import { AuctionItem, UserInfo } from "../../functions/auctions/models";
import { getComposer, getEmailOptoutLink, getTemplate, getTemplateRaw, sendMail } from "../mail.service";

const template: string = null;
const getLocalTemplate = async () => template ? template : await getTemplateRaw("outbidded.mail.mjml");

/**Sends outbidded mail */
export const sendOutbiddedMail = async (
    user: UserInfo,
    itemBefore: AuctionItem,
    itemAfter: AuctionItem
) => {
    const item_bid_before = `${itemBefore.bid} €`;
    const item_bid_after = `${itemAfter.bid} €`;

    logger.info(
        `Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}(${itemBefore.bidId}) from ${item_bid_before} to ${item_bid_after}!`
    );

    // load and customize html template
    const emailVariables = {
        optout_url: getEmailOptoutLink(),
        item_url: `${config.base.url}/aukcije/predmet;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
        item_name: itemAfter.name,
        item_bid_before,
        item_bid_after,
        user_name: user.name.trim().split(" ")[0],
        ...(await settingsSvc.getMailVariables())
    };

    const templateRaw = await getLocalTemplate();
    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`, template);
    const res = await sendMail(composer);
    logger.debug(res);
};