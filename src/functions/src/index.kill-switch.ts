import { logger } from "firebase-functions";
import { GoogleAuth } from "google-auth-library";
import { google } from 'googleapis';
import { appAdmin, appStore, europeFunctions } from "./functions/app";

export const killSwitch = europeFunctions().pubsub.topic('firebase-budget-alert')
    .onPublish(async (message, ctx) => {
        const PROJECT_ID = appAdmin().installations().app.options.projectId;
        const PROJECT_NAME = `projects/${PROJECT_ID}`;

        const data = JSON.parse(message.json);
        logger.error('Budget exceeeded', { data });

        const dynamicBudget = (await appStore().doc('config/global').get()).data().budget;

        logger.info(data);
        logger.info(data.costAmount);
        logger.info(data.budgetAmount);
        logger.info('Dynamic budget', dynamicBudget);

        if (data.costAmount <= dynamicBudget) {
            logger.info("No action necessary.");
            return `No action necessary. (Current cost: ${data.costAmount})`;
        }

        if (!PROJECT_ID) {
            logger.error("no project specified");
            return 'No project specified';
        }

        _setAuthCredential();

        const billingEnabled = await _isBillingEnabled(PROJECT_NAME);
        if (billingEnabled) {
            logger.warn("disabling billing");
            return _disableBillingForProject(PROJECT_NAME);
        } else {
            logger.info("billing already disabled");
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
        const billing = google.cloudbilling('v1').projects;

        const res = await billing.getBillingInfo({
            name: projectName
        });

        console.info(res);

        return res.data.billingEnabled;
    } catch (e) {
        console.error(
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
    const billing = google.cloudbilling('v1').projects;

    const res = await billing.updateBillingInfo({
        name: projectName,
        requestBody: {
            billingEnabled: false,
            // https://console.cloud.google.com/billing/01FE42-36ED66-134A0D
            billingAccountName: 'Brave Snouts'
        }, // Disable billing
    });

    console.info(res);
    console.info("Billing Disabled");

    return `Billing disabled: ${JSON.stringify(res.data)}`;
};