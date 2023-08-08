import { User } from "../../models/models";
/**Sends new handover details mail */
export declare const sendPostConfirmationMail: (user: User, auctionIds: string[], postFormData: any, totalDonation: string, paymentDetail: string, postageFee: number) => Promise<void>;
export declare const getPostConfirmUrl: (userId: string, totalDonation: string, paymentDetail: string, postageFee: number, auctionIds: string[]) => string;
