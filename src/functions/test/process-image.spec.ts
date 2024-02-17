// import { test } from 'bun:test';
import { assert } from 'chai';
import { appStorage } from '../src/functions/app';
import { StorageService } from '../src/functions/shared/services/storage.service';

const defTimeout = 0; // disable timeout
const defWait = 15; // default wait time

describe('process image tests', async () => {

    beforeEach(async () => {
        await appStorage().bucket().deleteFiles();
    })

    it('should process root original image', async () => {
        await appStorage().bucket().upload('test/test-assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'original/cup'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length > 0, 'should not be empty');
        assert.isTrue(files.length == 3, 'should be equal to 3');

        assertProcessedImage('', 'cup', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeout)

    it('should process nested original image', async () => {
        await appStorage().bucket().upload('test/test-assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'something/original/cup'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length > 0, 'should not be empty');
        assert.isTrue(files.length == 3, 'should be equal to 3');

        assertProcessedImage('something/', 'cup', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeout)

    it('should exit when processing non original image', async () => {
        await appStorage().bucket().upload('test/test-assets/cup.jpg', {
            contentType: 'image/jpeg',
            destination: 'nonoriginal/cup'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1 && files[0] == 'nonoriginal/cup', 'no other images should be present');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeout)

    it('should exit when processing not supported file or extension', async () => {
        await appStorage().bucket().upload('test/test-assets/cup.jpg', {
            contentType: 'application/pdf',
            destination: 'original/cup.pdf'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1 && files[0] == 'original/cup.pdf', 'no other files should be present');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeout)

    it('should exit when processing already processed image', async () => {
        await appStorage().bucket()
            .upload('test/test-assets/cup.jpg', {
                contentType: 'application/jpg',
                destination: 'original/cup.jpg',
                metadata: {
                    metadata: {
                        processedByFirebaseFunction: true
                    }
                }
            });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assert.isTrue(files.length == 1, 'should have no images, as the input should not have been processed');

        await checkForInfiniteTrigger(1);
    }).timeout(defTimeout)

    it('should set processedByFirebaseFunction when image has been processed', async () => {
        await appStorage().bucket()
            .upload('test/test-assets/cup.jpg', {
                contentType: 'application/jpg',
                destination: 'original/cup.jpg'
            });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as any[]).map(x => x);

        assert.isTrue(files.length == 3);

        assert.isTrue(files.every(f =>
            StorageService.isProcessedAlready(f) &&
            f.metadata.metadata.firebaseFunctionName == 'processImageFunction'
        ), 'all files should be processed');

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeout)

    it('storage service - external image downloads to internal storage and provides accessible links', async () => {
        const service = new StorageService();

        const firebaseFile = await service.externalToStorage({
            name: 'photo',
            url: 'https://picsum.photos/200',
            destination: 'picsum'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assertProcessedImage('picsum/', 'photo_original', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeout)

    it('storage service - external image downloads to internal storage and is processed, even if placed in nested original container', async () => {
        const service = new StorageService();

        const firebaseFile = await service.externalToStorage({
            name: 'photo',
            url: 'https://picsum.photos/200',
            destination: 'picsum/original'
        });
        await wait(defWait);

        const response = await appStorage().bucket().getFiles();
        const files = (response.flatMap(x => x) as File[]).map(x => x.name);

        assertProcessedImage('picsum/original/', 'photo_original', files);

        await checkForInfiniteTrigger(3);
    }).timeout(defTimeout)

});

function assertProcessedImage(rootPath: string, name: string, files: string[]) {
    assert.isTrue(files.filter(x => x == `${rootPath}original/${name}`).length == 1, 'should have 1 original');
    assert.isTrue(files.filter(x => x == `${rootPath}thumb/${name}_thumb`).length == 1, 'should have 1 thumb');
    assert.isTrue(files.filter(x => x == `${rootPath}compressed/${name}_compressed`).length == 1, 'should have 1 compressed');
}

async function checkForInfiniteTrigger(originalCount: number) {
    await wait(defWait * 2);
    const response = await appStorage().bucket().getFiles();
    const files = (response.flatMap(x => x) as File[]).map(x => x.name);
    assert.equal(files.length, originalCount);
}

async function wait(seconds: number) {
    await new Promise(res => setTimeout(() => res(null), seconds * 1000));
} 
