import { logger } from "firebase-functions";
import { GoogleAuth } from "google-auth-library";
import { google } from 'googleapis';
import { appAdmin, appStore, europeFunctions } from "./functions/app";

interface BudgetAlertData {
    budgetDisplayName: string, // "Brave snouts price alert"
    costAmount: number, // 0.16
    costIntervalStart: Date, // "2024-03-01T08:00:00Z"
    budgetAmount: number // 2.0,
    budgetAmountType: string // "SPECIFIED_AMOUNT",
    currencyCode: string // "USD"
}

interface ProjectBillingInfo {
    /**
     * The resource name of the billing account associated with the project, if any. For example, `billingAccounts/012345-567890-ABCDEF`.
     */
    billingAccountName?: string | null;
    /**
     * Output only. True if the project is associated with an open billing account, to which usage on the project is charged. False if the project is associated with a closed billing account, or no billing account at all, and therefore cannot use paid services.
     */
    billingEnabled?: boolean | null;
    /**
     * Output only. The resource name for the `ProjectBillingInfo`; has the form `projects/{project_id\}/billingInfo`. For example, the resource name for the billing information for project `tokyo-rain-123` would be `projects/tokyo-rain-123/billingInfo`.
     */
    name?: string | null;
    /**
     * Output only. The ID of the project that this `ProjectBillingInfo` represents, such as `tokyo-rain-123`. This is a convenience field so that you don't need to parse the `name` field to obtain a project ID.
     */
    projectId?: string | null;
}

export const killSwitch = europeFunctions().pubsub.topic('firebase-budget-alert')
    .onPublish(async (message, ctx) => {
        const PROJECT_ID = appAdmin().installations().app.options.projectId;
        const PROJECT_NAME = `projects/${PROJECT_ID}`;
        if (!PROJECT_ID) {
            throw new Error("No PROJECT_ID specified");
        }

        const jsonRaw = Buffer.from(message.data, 'base64').toString();
        const data = <BudgetAlertData>JSON.parse(jsonRaw);

        const dynamicBudget = (await appStore().doc('config/global').get()).data().budget;

        logger.info('Alert data', data);
        logger.info('Allowed budget limit', dynamicBudget);

        if (data.costAmount <= dynamicBudget) {
            logger.info("No action necessary.");
            return `No action necessary. (Current cost: ${data.costAmount}, Allowed cost: ${dynamicBudget})`;
        }

        _setAuthCredential();

        logger.warn("Limit reached, shutting things down");

        const billingInfo = await getBillingInfo(PROJECT_ID, PROJECT_NAME);
        const billingEnabled = billingInfo?.billingEnabled ?? true;

        if (billingEnabled) {
            logger.warn("disabling billing");
            return await _disableBillingForProject(PROJECT_NAME, billingInfo);
        } else {
            logger.warn("Billing already disabled");
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
const getBillingInfo = async (projectId, projectName) => {
    try {
        const billing = google.cloudbilling('v1').projects;

        const res = await billing.getBillingInfo({
            name: projectName,
        });

        return res.data;
    } catch (e) {
        console.error(
            'Unable to get billing information on specified project, assuming billing is enabled'
        );
        return <ProjectBillingInfo>{
            projectId: projectId,
            name: projectName,
            billingEnabled: true,
            billingAccountName: 'Brave Snouts'
        };
    }
};

/**
 * Disable billing for a project by removing its billing account
 * @param {string} projectName Name of project disable billing on
 * @return {string} Text containing response from disabling billing
 */
const _disableBillingForProject = async (projectName: string, billingInfo: ProjectBillingInfo) => {
    const billing = google.cloudbilling('v1').projects;

    // The billing account 
    // https://console.cloud.google.com/billing/01FE42-36ED66-134A0D

    // Disable billing
    const res = await billing.updateBillingInfo({
        name: projectName,
        requestBody: {
            billingEnabled: false, // disables the billing
            name: billingInfo?.name ?? null,
            projectId: billingInfo?.projectId ?? null,
            billingAccountName: billingInfo.billingAccountName ?? 'Brave Snouts',
        },
    });

    console.info(res);
    console.info("Billing Disabled");

    return `Billing disabled: ${JSON.stringify(res.data)}`;
};