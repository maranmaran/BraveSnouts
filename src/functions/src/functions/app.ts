import * as admin from 'firebase-admin';
import { Storage } from 'firebase-admin/lib/storage/storage';
import * as functions from 'firebase-functions';
import { MailSettingsService } from './shared/services/mail-settings.service';

export type AppConfig = {
    adminL: admin.app.App;
    storeL: admin.firestore.Firestore;
    storageL: Storage;
    configL: Record<string, any>;
    mailSettingsL: MailSettingsService;
    europeFunctionsL: functions.FunctionBuilder;
};

let _app: AppConfig = undefined;
export const app = () => {
    if (_app) {
        return _app;
    }

    _app = initialize();
    return _app;
};

export const appAdmin = () => app().adminL;
export const appStore = () => app().storeL;
export const appStorage = () => app().storageL;
export const appConfig = () => app().configL;
export const mailSettings = () => app().mailSettingsL;
export const europeFunctions = () => app().europeFunctionsL;

function initialize(): AppConfig {


    const adminL = admin.initializeApp();

    const storeL = admin.firestore();
    const storageL = admin.storage();
    const configL = functions.config();
    const mailSettingsL = new MailSettingsService(storeL);
    const europeFunctionsL = functions.region('europe-west1');

    admin.firestore().settings({ ignoreUndefinedProperties: true })

    const appL: AppConfig = {
        adminL,
        storeL,
        storageL,
        configL,
        mailSettingsL,
        europeFunctionsL
    };

    console.log(`Application configuration`, JSON.stringify(configL, null, 2));
    console.log(`Mail settings`, JSON.stringify(mailSettingsL, null, 2));

    return appL
}