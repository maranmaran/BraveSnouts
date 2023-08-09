import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './auctions/services/mail-settings.service';

export const app = initialize();
export const store = app.store;
export const config = app.config;
export const mailSettings = app.mailSettings;
export const europeFunctions = app.europeFunctions;

function initialize() {
    // console.debug('Initializing application');

    admin.initializeApp();

    const store = admin.firestore();
    const config = functions.config();
    const mailSettings = new MailSettingsService(store);
    const europeFunctions = functions.region('europe-west1');

    admin.firestore().settings({ ignoreUndefinedProperties: true })

    const app = {
        store,
        config,
        mailSettings,
        europeFunctions
    };

    // console.debug('done', app);

    return app
}