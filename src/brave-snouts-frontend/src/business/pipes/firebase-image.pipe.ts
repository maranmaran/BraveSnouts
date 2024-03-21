import { Pipe, PipeTransform, inject } from '@angular/core';
import { map } from 'rxjs';
import { ItemMedia } from 'src/app/features/auction-feature/item/item-media/item-media.component';
import { FirebaseFile } from '../models/firebase-file.model';
import { SettingsService } from '../services/settings.service';

@Pipe({
  name: 'firebaseImage'
})
export class FirebaseImagePipe implements PipeTransform {

  protected loadGradually$ = inject(SettingsService).settings$.pipe(
    map(x => x.gradualImageLoading)
  );

  transform(value: Partial<FirebaseFile & ItemMedia>, forceHighQuality: boolean = false) {
    return this.loadGradually$.pipe(
      map(loadGradually => {
        loadGradually ||= forceHighQuality;

        const original = value.urlOrig ?? value.original.gUrl;
        const compressed = value.urlComp ?? value.compressed.gUrl;
        const thumbnail = value.urlThumb ?? value.thumbnail.gUrl;

        const src = loadGradually ? original : compressed;
        const thumb = loadGradually ? compressed : thumbnail;

        return { src, thumb };
      })
    )
  }
}
