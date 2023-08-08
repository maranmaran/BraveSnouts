# Development

## Debugging

-   [Helpful article](https://medium.com/firebase-developers/debugging-firebase-functions-in-vs-code-a1caf22db0b2)

## Run emulator

Init if needed (probably not, contact project admin) `firebase init emulators`

Run:

-   `firebase emulators:start`
-   `firebase emulators:start --inspect-functions`

## Environment variables

[Environment configuration](https://firebase.google.com/docs/functions/config-env)

List of variables:

-   Stripe (used in PROD)
    -   `firebase functions:config:set stripe.secret="secret"`
-   Contentful (used in PROD)
    -   `firebase functions:config:set contentful.space="space" contentful.secret="apiKey"`
-   Base URL (used in PROD)
    -   `firebase functions:config:set base.url="baseurl"`
    -   ex: https://bravesnoutsdev.firebaseapp.com
-   Mail providers
    -   Set provider
        -   `firebase functions:config:set mail.provider="mailgun | gmail | ethereal"`
    -   Etheral mail secret (LOCAL)
        -   `firebase functions:config:set ethereal.user="patience56@ethereal.email" ethereal.password="jYsRxVBXdsfU6W8nHv"`
    -   GMail mail secret (used in PROD)
        -   `firebase functions:config:set gmail.user="patience56@gmail.email" gmail.password="jYsRxVBXdsfU6W8nHv"`
    -   Mailgun (used in PROD)
        -   `firebase functions:config:set mailgun.apikey="apiKey" mailgun.baseurl="baseUrl" mailgun.domain="domainName"`

## Deployment

At the moment two projects exist in firebase  
One is **dev** and other is **prod**

### Functions

#### Development

-   `firebase use dev`
-   `firebase deploy --only functions`

#### Production

-   `firebase use prod`
-   `firebase deploy --only functions`

## TODO:

### Facebook messaging

-   https://developers.facebook.com/docs/messenger-platform/policy/policy-overview#24hours_window
-   https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags
