import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './auctions/services/mail-settings.service';

export const app = initialize();
export const store = app.storeL;
export const config = app.configL;
export const mailSettings = app.mailSettingsL;
export const europeFunctions = app.europeFunctionsL;

function initialize() {
    // console.debug('Initializing application');

    admin.initializeApp();

    const storeL = admin.firestore();
    const configL = functions.config();
    const mailSettingsL = new MailSettingsService(store);
    const europeFunctionsL = functions.region('europe-west1');

    admin.firestore().settings({ ignoreUndefinedProperties: true })

    const appL = {
        storeL,
        configL,
        mailSettingsL,
        europeFunctionsL
    };

    // console.debug('done', app);

    return appL
}