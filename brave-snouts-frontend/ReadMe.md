# Development

## Setup

Install angular CLI `npm install -g @angular/cli`

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
- BASE_URL

## Deployment 

At the moment two projects exist in firebase  
One is **dev** and other is **prod**

Environments are generated dynamically through src/environments/set-env.script.ts
Add your .env file with appropriate keys for environments to generate

### Web app
#### Development

* `ng build` if you wish to debug otherwise `ng build -c development`
* `firebase use dev`
* `firebase deploy --only hosting -P dev`

#### Production

* `ng build -c production`
* `firebase use prod`
* `firebase deploy --only hosting -P prod`

