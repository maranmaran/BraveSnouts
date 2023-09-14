import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './auctions/services/mail-settings.service';

export const app = initialize();
export const appAdmin = app.adminL;
export const appStore = app.storeL;
export const appStorage = app.storageL;
export const appConfig = app.configL;
export const mailSettings = app.mailSettingsL;
export const europeFunctions = app.europeFunctionsL;

function initialize() {
    const adminL = admin.initializeApp();

    const storeL = admin.firestore();
    const storageL = admin.storage();
    const configL = functions.config();
    const mailSettingsL = new MailSettingsService(storeL);
    const europeFunctionsL = functions.region('europe-west1');

    admin.firestore().settings({ ignoreUndefinedProperties: true })

    const appL = {
        adminL,
        storeL,
        storageL,
        configL,
        mailSettingsL,
        europeFunctionsL
    };

    return appL
}