import { assert } from 'chai';
import { appStorage } from '../../src/functions/app';
import { StorageService } from '../../src/functions/shared/services/storage.service';

const defTimeoutS = 0; // disable timeout
const defWaitS = 5; // default wait time, secondss

describe('process image tests', async () => {
    beforeEach(async () => {
        // dotenv.config({ path: '.env.test' });
        process.env["CLOUD_RUNTIME_CONFIG"] = "test/test-assets/.runtimeconfig.test.json"
        await appStorage().bucket().deleteFiles();
    })

    it('should process root original image', async () => {
        await appStorage().bucket().upload('test/assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'original/cup.jpg'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length > 0, 'should not be empty');
        assert.isTrue(files.length == 3, 'should be equal to 3');

        assertProcessedImage('', 'cup', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeoutS)

    it('should process nested original image', async () => {
        await appStorage().bucket().upload('test/assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'something/original/cup.jpg'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length > 0, 'should not be empty');
        assert.isTrue(files.length == 3, 'should be equal to 3');

        assertProcessedImage('something/', 'cup', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeoutS)

    it('should exit when processing non original image', async () => {
        await appStorage().bucket().upload('test/assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'nonoriginal/cup.jpg'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1, 'should be single image');
        assert.isTrue(files[0] == 'nonoriginal/cup.jpg', 'no other than original should be present');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeoutS)

    it('should exit when processing not supported file or extension', async () => {
        await appStorage().bucket().upload('test/assets/cup.jpg', {
            contentType: 'application/pdf',
            destination: 'original/cup.pdf'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1 && files[0] == 'original/cup.pdf', 'no other files should be present');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeoutS)

    it('should exit when processing already processed image', async () => {
        await appStorage().bucket()
            .upload('test/assets/cup.jpg', {
                contentType: 'application/jpg',
                destination: 'original/cup.jpg',
                metadata: {
                    metadata: {
                        processedByFirebaseFunction: true
                    }
                }
            });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1, 'should have no images, as the input should not have been processed');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeoutS)

    it('should set processedByFirebaseFunction when image has been processed', async () => {
        await appStorage().bucket()
            .upload('test/assets/cup.jpg', {
                contentType: 'application/jpg',
                destination: 'original/cup.jpg'
            });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as any[]).map(x => x);

        assert.isTrue(files.length == 3);

        assert.isTrue(files.every(f =>
            StorageService.isProcessedAlready(f) &&
            f.metadata.metadata.firebaseFunctionName == 'processImageFunction'
        ), 'all files should be processed');

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeoutS)

    it('storage service - external image downloads to internal storage and provides accessible links', async () => {
        const service = StorageService.create();

        const firebaseFile = await service.externalToStorage({
            name: 'photo',
            url: 'https://picsum.photos/200',
            destination: 'picsum'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        // TODO: check firebaseFile links

        assertProcessedImage('picsum/', 'photo_original', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeoutS)

    it('storage service - external image downloads to internal storage and is processed, even if placed in nested original container', async () => {
        const service = StorageService.create();

        const firebaseFile = await service.externalToStorage({
            name: 'photo',
            url: 'https://picsum.photos/200',
            destination: 'picsum/original'
        });
        await wait(defWaitS);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assertProcessedImage('picsum/original/', 'photo_original', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeoutS)
});

function assertProcessedImage(rootPath: string, name: string, files: string[]) {
    assert.isTrue(files.filter(x => x == `${rootPath}original/${name}.jpg`).length == 1, 'should have 1 original');
    assert.isTrue(files.filter(x => x == `${rootPath}thumb/${name}_thumb.jpg`).length == 1, 'should have 1 thumb');
    assert.isTrue(files.filter(x => x == `${rootPath}compressed/${name}_compressed.jpg`).length == 1, 'should have 1 compressed');
}

async function checkForInfiniteTrigger(originalCount: number) {
    await wait(defWaitS * 2);
    const response = await appStorage().bucket().getFiles();
    const files = (response.flatMap(x => x) as File[]).map(x => x.name);
    assert.equal(files.length, originalCount, "INFINITE LOOP");
}

async function wait(seconds: number) {
    await new Promise(res => setTimeout(() => res(null), seconds * 1000));
} 
