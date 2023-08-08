import { User, UserInfo } from "../../models/models";
/**Sends new handover details mail */
export declare const sendHandoverDetailsUpdateMail: (user: UserInfo, auctionIds: string[], handoverDetails: string[]) => Promise<void>;
/**Sends new handover details mail */
export declare const sendHandoverConfirmationMail: (user: User, auctionIds: string[], chosenHandoverOption: string) => Promise<void>;
export declare const getHandoverConfirmUrl: (userId: string, auctionIds: string[]) => string;
