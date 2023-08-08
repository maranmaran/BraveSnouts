import * as functions from "firebase-functions";
/** Sends email notification to higher bidder */
export declare const increaseRaisedMoneyFn: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
