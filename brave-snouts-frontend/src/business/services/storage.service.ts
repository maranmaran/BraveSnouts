import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
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

    getDownloadUrl(path) {
        const ref = this.storage.ref(path);
        return ref.getDownloadURL();
    }
}