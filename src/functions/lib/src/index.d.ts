import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './services/mail-settings.service';
export declare const store: admin.firestore.Firestore;
export declare const config: Record<string, any>;
export declare const settingsSvc: MailSettingsService;
export declare const europeFunctions: functions.FunctionBuilder;
export declare const bidChangeFn: any;
export declare const endAuctionFn: any;
export declare const changeHandoverFn: any;
export declare const increaseRaisedMoneyFn: any;
export declare const exportAuctionFn: any;
export declare const processAuctionImageFn: any;
export declare const handoverConfirmFn: any;
export declare const sendWinnerMailFn: any;
export declare const testSendWinnerMailFn: any;
export declare const downloadMailsFn: any;
export declare const getProductsFn: any;
export declare const getPriceFn: any;
export declare const bidChange: any;
export declare const increaseRaisedMoney: any;
export declare const endAuction: any;
export declare const sendWinnerMail: any;
export declare const testSendWinnerMail: any;
export declare const changeHandover: any;
export declare const handoverConfirm: any;
export declare const processAuctionImage: any;
export declare const downloadMails: any;
export declare const exportAuction: any;
export declare const getProducts: any;
export declare const getPrice: any;
