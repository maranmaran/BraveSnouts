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
        -   `firebase functions:config:set ethereal.user="<mail>" ethereal.password="<pass>"`
    -   GMail mail secret (used in PROD)
        -   `firebase functions:config:set gmail.user="<mail>" gmail.password="<pass>"`
    -   Mailgun (used in PROD)
        -   `firebase functions:config:set mailgun.apikey="apiKey" mailgun.baseurl="baseUrl" mailgun.domain="domainName"`

## Deployment

At the moment two projects exist in firebase  
One is **dev** and other is **prod**

## Kill switch

There's a kill switch function that listen's to firebase budget alerts which are forwarded in pub/sub.
Once threshold is reached the billing is disabled.
This threshold is set in firestore configuration and can be dynamic.
Default is 150€ but can be increased through store if the app is receiving bigger traffic.

Alerts are also configured to send budget alert mails, SMS and call cell phone over 100€

### Functions

#### Development

-   `firebase use dev`
-   `firebase deploy --only functions`

#### Production

-   `firebase use prod`
-   `firebase deploy --only functions`
