# Development

## Debugging
* [Helpful article](https://medium.com/firebase-developers/debugging-firebase-functions-in-vs-code-a1caf22db0b2)

## Run emulator

Init if needed (probably not, contact project admin) `firebase init emulators`

Run:
* `firebase emulators:start`
* `firebase emulators:start --inspect-functions`

## Environment variables

[Environment configuration](https://firebase.google.com/docs/functions/config-env)

List of variables:
* Mail - user / pass
    * Set provider `firebase functions:config:set mail.provider="mailgun | gmail | ethereal"`
    * Etheral mail secret: `firebase functions:config:set ethereal.user="patience56@ethereal.email" ethereal.password="jYsRxVBXdsfU6W8nHv"` 
    * GMail mail secret (for PROD): `firebase functions:config:set gmail.user="patience56@gmail.email" gmail.password="jYsRxVBXdsfU6W8nHv"` 
    * Mailgun mail secret (for PROD): `firebase functions:config:set mailgun.apikey="apiKey" mailgun.baseurl="baseUrl" mailgun.domain="domainName"` 
* BaseURL
    * Protocol + domain: `firebase functions:config:set base.url="baseurl"`
    * https://bravesnoutsdev.firebaseapp.com for example 

## Deployment 

At the moment two projects exist in firebase  
One is **dev** and other is **prod**

### Functions
#### Development

* `firebase use dev`
* `firebase deploy --only functions`

#### Production

* `firebase use prod`
* `firebase deploy --only functions`

## TODO:

### Facebook messaging
* https://developers.facebook.com/docs/messenger-platform/policy/policy-overview#24hours_window
* https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags