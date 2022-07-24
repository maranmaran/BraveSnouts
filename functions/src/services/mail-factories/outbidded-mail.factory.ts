import { logger } from "firebase-functions";
import { config, currencySvc, settingsSvc } from "../..";
import { AuctionItem, UserInfo } from "../../models/models";
import { getComposer, getEmailOptoutLink, getTemplate, getTemplateRaw, sendMail } from "../mail.service";

/**Sends outbidded mail */
export const sendOutbiddedMail = async (
    user: UserInfo,
    itemBefore: AuctionItem,
    itemAfter: AuctionItem
) => {
    // get currency info
    await currencySvc.getEurRate();

    const item_bid_before = currencySvc.formatHrkAndEur(itemBefore.bid);
    const item_bid_after = currencySvc.formatHrkAndEur(itemAfter.bid);

    logger.info(
        `Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}(${itemBefore.bidId}) from ${item_bid_before} to ${item_bid_after}!`
    );

    // load and customize html template
    const emailVariables = {
        optout_url: getEmailOptoutLink(),
        item_url: `${config.base.url}/item;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
        item_name: itemAfter.name,
        item_bid_before,
        item_bid_after,
        user_name: user.name.trim().split(" ")[0],
        ...(await settingsSvc.getMailVariables())
    };

    const templateRaw = await getTemplateRaw("outbidded.mail.mjml");
    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`, template);
    const res = await sendMail(composer);
    console.debug(res);
};