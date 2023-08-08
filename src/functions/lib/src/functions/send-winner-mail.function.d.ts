/** Processes auctions end
 * Picks up item winners and sends email notification templates for won items
 * Marks auction as processed
 */
export declare const sendWinnerMailFn: import("firebase-functions").HttpsFunction & import("firebase-functions").Runnable<any>;
