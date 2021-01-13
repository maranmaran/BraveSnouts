
import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

 /** @deprecated */
@Injectable({ providedIn: 'root' })
export class FunctionsService {

    constructor(private functions: AngularFireFunctions) { }

    /** @deprecated */
    compressImage(file: File) {
        const callable = this.functions.httpsCallable('compressImage');
        
        return callable({ file });
    }
}