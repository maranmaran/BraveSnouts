/* tslint:disable */

// @ts-nocheck
const { writeFile, existsSync, mkdirSync } = require('fs');
const { argv } = require('yargs');
const { removeSync } = require('fs-extra');

require('dotenv').config();
const environment = argv.environment;

function writeFileUsingFS(targetPath, environmentFileContent) {
  writeFile(targetPath, environmentFileContent, function (err) {
    if (err) {
      console.log(err);
    }
    if (environmentFileContent !== '') {
      console.log(`wrote variables to ${targetPath}`);
    }
  });
}

// Checks whether command line argument of `prod` was provided signifying production mode
const isProduction = environment === 'prod';

//creates the `environment.prod.ts` and `environment.ts` file if it does not exist
if (isProduction) {
  removeSync('./src/environments/environment.prod.ts');
  writeFileUsingFS('./src/environments/environment.prod.ts', '');
} else {
  removeSync('./src/environments/environment.dev.ts');
  writeFileUsingFS('./src/environments/environment.dev.ts', '');
}

// this is default since .prod.ts or .dev.ts get rewritten to this from angular.json file config
writeFileUsingFS('./src/environments/environment.ts', '');

// choose the correct targetPath based on the environment chosen
const targetPath = isProduction
  ? './src/environments/environment.prod.ts'
  : './src/environments/environment.dev.ts';
const defaultTargetPath = './src/environments/environment.ts';

//actual content to be compiled dynamically and pasted into respective environment files

// firebase environment data
const apiKey = process.env.FIREBASE_API_KEY;
const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
const databaseURL = process.env.FIREBASE_DATABASE_URL;
const projectId = process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.FIREBASE_APP_ID;
const measurementId = process.env.FIREBASE_MEASUREMENT_ID;
const contentfulSpace = process.env.CONTENTFUL_SPACE;
const contentfulApiKey = process.env.CONTENTFUL_API_KEY;
const contentfulPreviewApiKey = process.env.CONTENTFUL_PREVIEW_API_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!apiKey) throw new Error(`apiKey missing`);
if (!authDomain) throw new Error(`authDomain missing`);
// if(!databaseURL)
//   throw new Error(`databaseURL missing`);
if (!projectId) throw new Error(`projectId missing`);
if (!storageBucket) throw new Error(`storageBucket missing`);
if (!messagingSenderId) throw new Error(`messagingSenderId missing`);
if (!appId) throw new Error(`appId missing`);
if (!measurementId) throw new Error(`measurementId missing`);

if (projectId == 'bravesnoutsprod') {
  console.error('\n\n\n');
  console.error('===========================================================');
  console.error('==============Watch out you are in PROD env================');
  console.error('===========================================================');
  console.error('\n\n\n');
}

// Build environment file
const buildEnvironmentFileContent = `
  // This file was autogenerated by dynamically running set-env.script.ts and using dotenv for managing API key secrecy
  export const environment = {
    production: ${isProduction},
    baseUrl: "${process.env.BASE_URL ?? "https://hrabrenjuske.hr"}",
    firebaseConfig: {
      apiKey: "${apiKey}",
      authDomain: "${authDomain}",
      databaseURL: "${databaseURL}",
      projectId: "${projectId}",
      storageBucket: "${storageBucket}",
      messagingSenderId: "${messagingSenderId}",
      appId: "${appId}",
      measurementId: "${measurementId}"
    },
    contentful: {
      space: '${contentfulSpace}',
      apiKey: '${contentfulApiKey}',
      previewKey: '${contentfulPreviewApiKey}'
    },
    stripe: {
      secretKey: '${stripeSecretKey}',
      publishableKey: '${stripePublishableKey}'
    },
    pageSizes: {
      itemsList: ${process.env.PAGE_SIZE_ITEMS_LIST ?? 16},
    },
    itemCardConfig: {
      minBidOffset: ${process.env.APP_MIN_BID_OFFSET ?? 5},
      maxBidOffset: ${process.env.APP_MAX_BID_OFFSET ?? 30},
      bidStepSize: ${process.env.APP_BID_STEP_SIZE ?? 5}
    },
    imageCacheSeed: ${process.env.CACHE_SEED ?? 7}
  };
`;

writeFileUsingFS(targetPath, buildEnvironmentFileContent); // appending data into the target file

const defaultEnvironmentFileContent = `
// This file was autogenerated by dynamically running set-env.script.ts and using dotenv for managing API key secrecy
export const environment: any = {
};`;
writeFileUsingFS(defaultTargetPath, defaultEnvironmentFileContent); // appending data into the target file

/* tslint:enable */
