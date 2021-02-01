import { europeFunctions, store } from "..";

export const bidChangeEmailOptOutFn = europeFunctions.https.onRequest((req, resp) => {

    let userId = req.params.userId;

    store.collection("users").doc(userId).update({
        emailSettings: {
            bidUpdates: false
        }
    });

    resp.jsonp({ status: 'ok', code: 200 });
})
