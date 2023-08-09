import { AuctionItem, UserInfo } from "../../models/models";
/**Sends outbidded mail */
export declare const sendOutbiddedMail: (user: UserInfo, itemBefore: AuctionItem, itemAfter: AuctionItem) => Promise<void>;
