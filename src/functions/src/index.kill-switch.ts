import { CloudBillingClient } from "@google-cloud/billing";
import { logger } from "firebase-functions";
import { appAdmin, appStore, europeFunctions } from "./functions/app";

const billingApi = new CloudBillingClient();

// Documentation:
// https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage
export const killSwitch = europeFunctions().pubsub.topic('firebase-budget-alert')
    .onPublish(async (alert, _) => {
        const PROJECT_ID = appAdmin().installations().app.options.projectId;
        const PROJECT_NAME = `projects/${PROJECT_ID}`;
        if (!PROJECT_ID) throw new Error("No PROJECT_ID specified");

        const budgetAlert = parseBudgetAlert(alert);
        const currentCost = budgetAlert.costAmount;
        logger.info('Budget alert', budgetAlert);

        const budget = await getHardLimitBudget();
        logger.info('Allowed budget limit', budget);

        if (currentCost <= budget) {
            logger.info(`No action necessary.`, {
                currentCost, budget
            });
            return;
        }

        logger.warn("Limit reached, shutting things down");

        const billingInfo = await getBillingInfo(PROJECT_ID, PROJECT_NAME);
        const billingEnabled = billingInfo?.billingEnabled ?? true;
        if (billingEnabled === false) {
            logger.info(`Billing already disabled for ${PROJECT_NAME}`);
            return;
        }

        logger.warn(`Disabling billing for ${PROJECT_NAME}`);
        await disableBillingForProject(PROJECT_NAME);
        logger.warn(`Billing disabled for ${PROJECT_NAME}`);
    })

const parseBudgetAlert = (msg: { data: string }) => {
    const jsonRaw = Buffer.from(msg.data, 'base64').toString();
    return <BudgetAlertData>JSON.parse(jsonRaw);
}

const getHardLimitBudget = async () => {
    try {
        return (await appStore().doc('config/global').get()).data().budget;
    } catch (e) {
        logger.error("Could not retrieve configurable budget limit from firestore", e);
        logger.error("Defaulting to 200 USD");

        // default some do-not-wanna-pay hard-limit
        return 200;
    }
}

const getBillingInfo = async (projectId: string, projectName: string) => {
    try {
        const [billingInfo] = await billingApi.getProjectBillingInfo({ name: projectName });

        logger.info("Billing information", billingInfo);
        return billingInfo;
    } catch (e) {
        logger.error(
            'Unable to get billing information on specified project, assuming billing is enabled',
            e
        );

        // assume enabled
        return <ProjectBillingInfo>{
            projectId: projectId,
            name: projectName,
            billingEnabled: true,
            billingAccountName: 'Brave Snouts'
        };
    }
};

const disableBillingForProject = async (projectName: string) => {
    try {
        const [billingInfo] = await billingApi.updateProjectBillingInfo({
            name: projectName,
            projectBillingInfo: {
                billingAccountName: '' // disables billing
            }
        });

        logger.warn("Billing Disabled", billingInfo);
    } catch (e) {
        logger.error('Could not disable billing', e);
        throw e;
    }
};

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
