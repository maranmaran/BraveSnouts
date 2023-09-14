// import { test } from 'bun:test';
import { assert } from 'chai';
import firebaseAdmin from 'firebase-admin';
import firebaseTestInit from 'firebase-functions-test';

const firebaseTest = firebaseTestInit({});
// firebaseTest.mockConfig({ stripe: { key: '23wr42ewr34' }});
// firebaseTest.wrap(func);

const projectId = 'bravesnoutsdev'
const storageBucket = 'bravesnoutsdev.appspot.com';

process.env.GCLOUD_PROJECT = projectId
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199'
firebaseAdmin.initializeApp({ projectId, storageBucket })

const storage = firebaseAdmin.storage();
const store = firebaseAdmin.firestore();

const timeout = 0; // disable timeout

describe('process image tests', async () => {

    beforeEach(async () => {
        await storage.bucket().deleteFiles();
    })

    it('should process original image', async () => {

        await storage.bucket().upload('test-assets/cup.jpg', { contentType: 'image/jpeg', destination: 'original/cup' });
        await wait(5);

        const response = await storage.bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length > 0, 'should not be empty');
        assert.isTrue(files.length == 3, 'should be equal to 3');

        assert.isTrue(files.filter(x => x.includes('original/cup')).length == 1, 'should have 1 original');
        assert.isTrue(files.filter(x => x.includes('thumb/cup_thumb')).length == 1, 'should have 1 thumb');
        assert.isTrue(files.filter(x => x.includes('compressed/cup_compressed')).length == 1, 'should have 1 compressed');
    }).timeout(timeout)

    it('should exit when processing non original image', async () => {
        await storage.bucket().upload('test-assets/cup.jpg', { contentType: 'image/jpeg', destination: 'nonoriginal/cup' });
        await wait(5);

        const response = await storage.bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1 && files[0] == 'nonoriginal/cup', 'no other images should be present');
    }).timeout(timeout)

});

async function wait(seconds: number) {
    await new Promise(res => setTimeout(() => res(null), seconds * 1000));
} 
