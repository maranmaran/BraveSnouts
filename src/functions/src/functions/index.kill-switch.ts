import { error } from "firebase-functions/logger";
import { GoogleAuth } from "google-auth-library";
import { google } from 'googleapis';
import { appAdmin, appStore, europeFunctions } from "./app";

const PROJECT_ID = appAdmin().installations().app.options.projectId;
const PROJECT_NAME = `projects/${PROJECT_ID}`;
const billing = google.cloudbilling('v1').projects;

export const killSwitch = europeFunctions().pubsub.topic('firebase-budget-alert')
    .onPublish(async (message, ctx) => {
        const data = JSON.parse(message.json);
        error('Budget exceeeded', { data });

        const dynamicBudget = (await appStore().doc('config/global').get()).data().budget;

        console.log(data);
        console.log(data.costAmount);
        console.log(data.budgetAmount);
        console.log('Dynamic budget', dynamicBudget);

        if (data.costAmount <= dynamicBudget) {
            console.log("No action necessary.");
            return `No action necessary. (Current cost: ${data.costAmount})`;
        }

        if (!PROJECT_ID) {
            console.log("no project specified");
            return 'No project specified';
        }

        _setAuthCredential();

        const billingEnabled = await _isBillingEnabled(PROJECT_NAME);
        if (billingEnabled) {
            console.log("disabling billing");
            return _disableBillingForProject(PROJECT_NAME);
        } else {
            console.log("billing already disabled");
            return 'Billing already disabled';
        }
    })


/**
 * @return {Promise} Credentials set globally
 */
const _setAuthCredential = () => {
    const client = new GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-billing',
            'https://www.googleapis.com/auth/cloud-platform',
        ],
    });

    // Set credential globally for all requests
    google.options({
        auth: client,
    });
};

/**
 * Determine whether billing is enabled for a project
 * @param {string} projectName Name of project to check if billing is enabled
 * @return {bool} Whether project has billing enabled or not
 */
const _isBillingEnabled = async projectName => {
    try {
        const res = await billing.getBillingInfo({
            name: projectName
        });
        console.log(res);
        return res.data.billingEnabled;
    } catch (e) {
        console.log(
            'Unable to determine if billing is enabled on specified project, assuming billing is enabled'
        );
        return true;
    }
};

/**
 * Disable billing for a project by removing its billing account
 * @param {string} projectName Name of project disable billing on
 * @return {string} Text containing response from disabling billing
 */
const _disableBillingForProject = async projectName => {
    const res = await billing.updateBillingInfo({
        name: projectName,
        requestBody: {
            billingEnabled: false,
            billingAccountName: 'Brave Snouts'
        }, // Disable billing
    });

    console.log(res);
    console.log("Billing Disabled");

    return `Billing disabled: ${JSON.stringify(res.data)}`;
};