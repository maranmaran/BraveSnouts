import { config, europeFunctions, firebaseAdmin, store } from "..";
import * as cookieParser from "cookie-parser";
import * as crypto from 'crypto';

const OAUTH_REDIRECT_URI = `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/popup.html`;
const OAUTH_SCOPES = 'basic';

/**
 * Creates a configured simple-oauth2 client for Instagram.
 */
function instagramOAuth2Client() {
    // Instagram OAuth 2 setup
    // TODO: Configure the `instagram.client_id` and `instagram.client_secret` Google Cloud environment variables.
    const credentials = {
        client: {
            id: config.instagram.client_id,
            secret: config.instagram.client_secret,
        },
        auth: {
            tokenHost: 'https://api.instagram.com',
            tokenPath: '/oauth/access_token',
        },
    };
    return require('simple-oauth2').create(credentials);
}

/**
 * Redirects the User to the Instagram authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
export const instagramRedirectFn = europeFunctions.https.onRequest((req, res) => {
    const oauth2 = instagramOAuth2Client();

    cookieParser()(req, res, () => {
        const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
        console.log('Setting verification state:', state);
        res.cookie('state', state.toString(), {
            maxAge: 3600000,
            secure: true,
            httpOnly: true,
        });
        const redirectUri = oauth2.authorizationCode.authorizeURL({
            redirect_uri: OAUTH_REDIRECT_URI,
            scope: OAUTH_SCOPES,
            state: state,
        });
        console.log('Redirecting to:', redirectUri);
        res.redirect(redirectUri);
    });
});

/**
 * Exchanges a given Instagram auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token, display name, photo URL and Instagram acces token are sent back in a JSONP callback
 * function with function name defined by the 'callback' query parameter.
 */
export const instagramTokenFn = europeFunctions.https.onRequest(async (req, res) => {
    const oauth2 = instagramOAuth2Client();

    try {
        const parser = cookieParser();
        return parser(req, res, async () => {

            console.log('Received verification state:', req.cookies.state);
            console.log('Received state:', req.query.state);

            if (!req.cookies.state) {
                throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
            } else if (req.cookies.state !== req.query.state) {
                throw new Error('State validation failed');
            }

            console.log('Received auth code:', req.query.code);

            const results = await oauth2.authorizationCode.getToken({
                code: req.query.code,
                redirect_uri: OAUTH_REDIRECT_URI,
            });

            console.log('Auth code exchange result received:', results);

            // We have an Instagram access token and the user identity now.
            const accessToken = results.access_token;
            const instagramUserID = results.user.id;
            const profilePic = results.user.profile_picture;
            const userName = results.user.full_name;
            const email = results.user.email;

            // Create a Firebase account and get the Custom Auth Token.
            const firebaseToken = await createFirebaseAccount(instagramUserID, userName, profilePic, email, accessToken);

            // Serve an HTML page that signs the user in and updates the user profile.
            return res.jsonp({ token: firebaseToken });
        }) as any;
    }
    catch (error) {
        return res.jsonp({ error: error.toString() });
    }
});

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /instagramAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(instagramID: string, displayName: string, photoURL: string, email: string, accessToken: string) {
    // The UID we'll assign to the user.
    const uid = `instagram:${instagramID}`;

    // Save the access token to the Firebase Realtime Database.
    const databaseTask = firebaseAdmin.database().ref(`/instagramAccessToken/${uid}`).set(accessToken);

    // Create or update the user account.
    const userCreationTask = firebaseAdmin.auth().updateUser(uid, {
        displayName: displayName,
        photoURL: photoURL,

    }).catch((error) => {
        // If user does not exists we create it.
        if (error.code === 'auth/user-not-found') {
            return firebaseAdmin.auth().createUser({
                uid: uid,
                displayName: displayName,
                photoURL: photoURL,
                email: email,
            });
        }
        throw error;
    });

    const firestoreUser = store.collection("users").doc();
    await firestoreUser.set({
        id: uid,
        displayName,
        avatar: photoURL,
        email,
        providerId: "instagram",
        signInMethod: "instagram",
    })

    // Wait for all async task to complete then generate and return a custom auth token.
    await Promise.all([userCreationTask, databaseTask]);
    // Create a Firebase custom auth token.
    const token = await firebaseAdmin.auth().createCustomToken(uid);
    console.log('Created Custom token for UID "', uid, '" Token:', token);
    return token;
}