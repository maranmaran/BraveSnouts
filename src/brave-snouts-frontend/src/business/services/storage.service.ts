import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseFile } from '../models/firebase-file.model';

@Injectable({ providedIn: 'root' })
export class StorageService {

    constructor(private storage: AngularFireStorage) { }

    uploadFile(file, filePath = null) {
        const ref = this.storage.ref(filePath);

        return { ref, task: this.storage.upload(filePath, file, { cacheControl: 'public,max-age=1210000' }) };
    }

    uploadFileNoRef(file, filePath = null) {
        if (!filePath) {
            filePath = `images/${file.name}`;
        }

        return this.storage.upload(filePath, file, { cacheControl: 'public,max-age=1210000' });
    }

    deleteFile(url) {
        // const fileRef = this.storage.ref(filePath);
        return this.storage.storage.refFromURL(url).delete();
    }

    getDownloadUrl(file) {
        return this.storage.ref(file).getDownloadURL().pipe(take(1));
    }

    async uploadAuctionImage(auctionId: string, file: File, allFiles: FirebaseFile[]) {
        const name = uuidv4() + "_original.jpg";
        const path = `${this.getImageBucket(auctionId)}/original/${name}`;
        const type = this.getFirebaseFileType(file.type);

        const { ref, task } = this.uploadFile(file, path);
        await task;

        const url: string = await firstValueFrom(ref.getDownloadURL());

        const firebaseFile = <FirebaseFile>{
            name, type, path,
            urlOrig: url,
            // compressed and thumb don't exist yet but will once async compression is done on backend 
            urlComp: url.replace('%2Foriginal%2F', '%2Fcompressed%2F').replace('_original', '_original_compressed'),
            urlThumb: url.replace('%2Foriginal%2F', '%2Fthumb%2F').replace('_original', '_original_thumb')
        };

        allFiles.push(firebaseFile);
        return allFiles;
    }

    private getImageBucket = (auctionId: string) => `auction-items/${auctionId}`;
    private getFirebaseFileType = (type): 'file' | 'image' | 'video' => type.indexOf('image') != -1 ? 'image' : 'video';
}
