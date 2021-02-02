import { europeFunctions, store } from "..";

export const bidChangeEmailOptOutFn = europeFunctions.https.onRequest(async (req, resp) => {

    const userId = req.params.userId;

    await store.collection("users").doc(userId).update({
        emailSettings: {
            bidUpdates: false,
        },
    });

    resp.jsonp({ status: 'ok', code: 200 });
})
