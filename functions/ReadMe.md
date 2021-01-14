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

`firebase functions:config:set mail.user="patience56@ethereal.email" mail.password="jYsRxVBXdsfU6W8nHv"`


## TODO:

### Facebook messaging
* https://developers.facebook.com/docs/messenger-platform/policy/policy-overview#24hours_window
* https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags