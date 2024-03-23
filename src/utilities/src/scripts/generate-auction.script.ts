import { faker } from "@faker-js/faker";
import { firebaseConfig, firebase_tools, storage, store } from "../base-setup";
import { FirebaseFile } from "../models";
import { AuctionItemGenerator } from "../services/auction-item.generator";
import { AuctionGenerator } from "../services/auction.generator";
import { ImageGenerator } from "../services/image.generator";

const cleanData = false;
const seedNewImages = false;
const auctionSizes = [5, 50, 100];
// const auctionSizes = [5, 20, 100, 300, 500];

(async () => {

  cleanData && await resetData();

  const images = seedNewImages
    ? await seedImages()
    : await getExistingImages();

  for (const size of auctionSizes) {
    console.log(`Generating auction of size ${size} - STARTED`);

    // console.log('Seeding auction');
    const auction = await new AuctionGenerator().generate(size);
    const auctionDoc = store.collection("auctions").doc(auction.id);
    await auctionDoc.set(auction);
    // console.log('Auction seed finished');

    // console.log('Seeding auction items');
    const batch = store.batch();

    for (const item of await new AuctionItemGenerator(auction.id).generate(size)) {
      item.media = faker.helpers.arrayElements(images, faker.datatype.number({ min: 0, max: 5 }));
      batch.set(store.collection(`auctions/${auction.id}/items`).doc(item.id), item);
    }

    batch.commit();
    // console.log('Auction items seed finished');

    console.log(`Generating auction of size ${size} - FINISHED`);
  }
})();

async function seedImages() {
  console.log('Seeding images');
  const imageGenerator = new ImageGenerator("automation-images");
  const images = await imageGenerator.generate(40);
  console.log('Image seed finished');
  return images;
}

async function getExistingImages() {
  const files = await storage.bucket().getFiles({ prefix: 'auction-items/automation-images/original/', delimiter: '/' });

  const result: FirebaseFile[] = [];
  for (const file of files[0]) {
    const fileName = file.name.split('_')[0].split('/').reverse()[0].split('.');

    const urlOrig = file.publicUrl();
    const urlThumb = await getUrl('auction-items/automation-images/thumb/' + fileName[0] + '_thumb.' + fileName[1]);
    const urlComp = await getUrl('auction-items/automation-images/compressed/' + fileName[0] + '_compressed.' + fileName[1]);

    result.push({
      name: fileName[0],
      type: 'image',
      original: {
        path: `auction-items/automation-images/original`,
        fUrl: urlOrig,
        gUrl: urlOrig,
      },
      compressed: {
        path: `auction-items/automation-images/compressed`,
        fUrl: urlComp,
        gUrl: urlComp,
      },
      thumbnail: {
        path: `auction-items/automation-images/thumbnail`,
        fUrl: urlThumb,
        gUrl: urlThumb,
      },
    });
  }

  return result;
}

async function getUrl(path: string) {
  return storage.bucket().file(path).publicUrl()
}

async function resetData() {

  if (firebaseConfig.authDomain?.includes('bravesnoutsdev') == false) {
    throw new Error('Don\'t use production when cleaning data');
  }
  if (process.env.GCLOUD_PROJECT != 'bravesnoutsdev') {
    throw new Error('Don\'t use production when cleaning data');
  }

  await cleanCollection('auctions')
  await cleanCollection('bids')
}

async function cleanCollection(collectionId: string) {
  await firebase_tools.firestore.delete(collectionId, {
    project: process.env.GCLOUD_PROJECT,
    recursive: true,
    yes: true,
    force: true
  });
}