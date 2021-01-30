import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { of } from 'rxjs';

@Injectable()
export class StorageService {
    
    constructor(private storage: AngularFireStorage) { }

    uploadFile(file, filePath = null) {
        if(!filePath) {
            filePath = `images/${file.name}`;
        }
        
        const ref = this.storage.ref(filePath);

        return { ref, task: this.storage.upload(filePath, file) };
    }

    deleteFile(url) {
        // const fileRef = this.storage.ref(filePath);
        return this.storage.storage.refFromURL(url).delete();
    }
}