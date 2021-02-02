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
    * Etheral mail secret: `firebase functions:config:set mail.user="patience56@ethereal.email" mail.password="jYsRxVBXdsfU6W8nHv"` 
* Instagram API - user / pass
    * Instagram secret: `firebase functions:config:set instagram.client_id="yourClientID" instagram.client_secret="yourClientSecret"` 
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