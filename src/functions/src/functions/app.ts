import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as mailSettings from './auctions/services/mail-settings.service';

export const app = initialize()

function initialize() {
    admin.initializeApp();
    const store = admin.firestore();
    const config = functions.config();
    const settingsSvc = new mailSettings.MailSettingsService(store);
    admin.firestore().settings({ ignoreUndefinedProperties: true })

    return {
        store,
        config,
        settingsSvc,
    }
}