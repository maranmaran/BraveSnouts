import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { of } from 'rxjs';

@Injectable()
export class StorageService {
    
    constructor(private storage: AngularFireStorage) { }

    uploadFile(file, filePath = 'images') {
        // const fileRef = this.storage.ref(filePath);
        return this.storage.upload(filePath, file);
    }

    deleteFile(url) {
        // const fileRef = this.storage.ref(filePath);
        return this.storage.storage.refFromURL(url).delete();
    }

    getDownloadUrl(path: string) {
        if(path.startsWith('https://') || path.startsWith('http://'))
            return of(path);

        const ref = this.storage.ref(path);
        return ref.getDownloadURL();
    }
}