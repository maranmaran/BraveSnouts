import { Pipe, PipeTransform } from '@angular/core';
import { StorageService } from 'src/business/services/storage.service';


@Pipe({
  name: 'firebasePath'
})
export class FirebasePathPipe implements PipeTransform {

  constructor(private readonly storageSvc: StorageService) {
  }

  transform(value: string) {
    return this.storageSvc.getDownloadUrl(value);
  }
}
