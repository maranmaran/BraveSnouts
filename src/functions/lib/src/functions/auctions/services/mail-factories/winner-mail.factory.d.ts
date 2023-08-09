import { Auction, Bid, UserInfo } from "../../models/models";
/**Sends auction end mail */
export declare const sendWinnerMail: (auctions: Auction[], handoverDetails: string[], user: UserInfo, items: Bid[], settingsMailVariables: any) => Promise<void>;
