import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './auctions/services/mail-settings.service';
export declare const app: {
    store: admin.firestore.Firestore;
    config: Record<string, any>;
    mailSettings: MailSettingsService;
    europeFunctions: functions.FunctionBuilder;
};
export declare const store: admin.firestore.Firestore;
export declare const config: Record<string, any>;
export declare const mailSettings: MailSettingsService;
export declare const europeFunctions: functions.FunctionBuilder;
