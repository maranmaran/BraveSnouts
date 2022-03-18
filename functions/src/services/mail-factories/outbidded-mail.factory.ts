import { logger } from "firebase-functions";
import { config, settingsSvc } from "../..";
import { AuctionItem, UserInfo } from "../../models/models";
import { getComposer, getEmailOptoutLink, getTemplate, sendMail } from "../mail.service";

/**Sends outbidded mail */
export const sendOutbiddedMail = async (
    user: UserInfo,
    itemBefore: AuctionItem,
    itemAfter: AuctionItem
) => {
    logger.info(
        `Sending mail to ${user.email} as he was outbidded on ${itemBefore.name}(${itemBefore.bidId}) from ${itemBefore.bid} kn to ${itemAfter.bid} kn!`
    );

    // load and customize html template
    const emailVariables = {
        optout_url: getEmailOptoutLink(),
        item_url: `${config.base.url}/item;auctionId=${itemAfter.auctionId};itemId=${itemBefore.id}`,
        item_name: itemAfter.name,
        item_bid_before: itemBefore.bid,
        item_bid_after: itemAfter.bid,
        user_name: user.name.trim().split(" ")[0],
        ...(await settingsSvc.getMailVariables())
    };

    const template = await getTemplate("outbidded.mail.mjml", emailVariables);
    const composer = getComposer(user.email, `Tvoja ponuda za predmet "${itemBefore.name}" je nadmašena!`, template);
    const res = await sendMail(composer);
    console.debug(res);
};