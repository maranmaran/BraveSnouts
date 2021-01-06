# What is Brave Snouts

[Brave Snouts is animal rescue non profit organization](https://www.facebook.com/hrabrenjuske) 

Which can be helped only through donating.
Brave Snouts often organize auctions on which they place items that they were given or collected up for sale so people can bid on them and once it's over highest bidder wins the item and the money goes to organization to help animals get food, shelter and necessary vet treatments.

This task which was usually made on facebook is a bit gruelsome to organize and hard to keep track of. So I developed this small application to help them with just that -> ***auctions***.

There will possibly be future plans or turning this into their official public website and displaying aggregated data from social media but that is ***TBD***.

If you wish to contribute please contact me by mail

Visit current version in production [here](https://bravesnoutsprod.firebaseapp.com)

# Developer notes

This app is developed with angular 10+ and firebase as backend server / database.
It consumes firebase firestore, auth, storage, functions.

## Deployment 

At the moment two projects exist in firebase  
One is **dev** and other is **prod**

Environments are generated dynamically through src/environments/set-env.script.ts
Add your .env file with appropriate keys for environments to generate

### Web app
#### Development
`ng build` if you wish to debug otherwise `ng build -c development`

`firebase use dev`

`firebase deploy --only hosting -P dev`

#### Production
`ng build -c production`

`firebase use prod`

`firebase deploy --only hosting -P prod`

### Functions
#### Development
`firebase use dev`

`firebase deploy --only functions -P dev`

#### Production
`firebase use prod`

`firebase deploy --only functions -P prod`

## Serving locally

Serve locally with `npm run start`

It will use `local` build configuration upon `ng serve` and replace environment with 
dev environment but use source maps and all the standard local development ng serve would use.

Make sure you have appropriate `.env` file

**Firebase:**
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- FIREBASE_MEASUREMENT_ID

**App settings:**
- APP_MIN_BID_OFFSET
- APP_MAX_BID_OFFSET

