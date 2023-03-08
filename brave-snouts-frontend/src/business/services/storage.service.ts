import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class StorageService {

    constructor(private storage: AngularFireStorage) { }

    uploadFile(file, filePath = null) {
        if (!filePath) {
            filePath = `images/${file.name}`;
        }

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
}
