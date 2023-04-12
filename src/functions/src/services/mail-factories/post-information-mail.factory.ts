import { logger } from "firebase-functions";
import { config, settingsSvc } from "../..";
import { User } from "../../models/models";
import { getComposer, getTemplate, getTemplateRaw, sendMail } from "../mail.service";

/**Sends new handover details mail */
export const sendPostConfirmationMail = async (
    user: User,
    auctionIds: string[],
    postFormData: any,
    totalDonation: string,
    paymentDetail: string,
    postageFee: number
) => {
    logger.info(`Sending mail to ${user.email} for chosen post option confirm`);

    // load and customize html template
    const emailVariables = {
        post_confirm_url: getPostConfirmUrl(
            user.id,
            totalDonation,
            paymentDetail,
            postageFee,
            auctionIds
        ),
        user_name: user.displayName.trim().split(" ")[0],
        full_name: postFormData.fullName,
        address: postFormData.address,
        phone: postFormData.phoneNumber,
        ...(await settingsSvc.getMailVariables())
    };

    const templateRaw = await getTemplateRaw("post-confirm.mail.mjml");
    const template = await getTemplate(templateRaw, emailVariables);
    const composer = getComposer(user.email, "[Preuzimanje poštom] Potvrda", template);
    const res = await sendMail(composer);
    console.debug(res);
};

export const getPostConfirmUrl = (
    userId: string,
    totalDonation: string,
    paymentDetail: string,
    postageFee: number,
    auctionIds: string[]
) => {
    const ids = auctionIds.join(",");
    return `${config.base.url}/potvrda-posta;auctionIds=${ids};userId=${userId};donation=${totalDonation};paymentDetails=${paymentDetail};postageFee=${postageFee}`;
};

