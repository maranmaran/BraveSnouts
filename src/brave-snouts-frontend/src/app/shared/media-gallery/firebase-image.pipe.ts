import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageItemData } from 'ng-gallery';
import { map, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FirebaseFile } from '../../../business/models/firebase-file.model';
import { SettingsService } from '../../../business/services/settings.service';

@Pipe({
  name: 'firebaseImage',
  standalone: true
})
export class FirebaseImagePipe implements PipeTransform {
  private readonly settingsSvc = inject(SettingsService);
  readonly imageCacheSeed = environment.imageCacheSeed

  protected loadGradually$ = this.settingsSvc.settings$.pipe(
    map(x => x.gradualImageLoading),
    shareReplay(1)
  );

  private cachedImage(url: string) {
    return url + '?cacheKey=' + this.imageCacheSeed
  }

  transform(value: Partial<FirebaseFile>, forceHighQuality: boolean = false) {
    return this.loadGradually$.pipe(
      map(loadGradually => loadGradually ||= forceHighQuality),
      map(loadGradually => {
        const original = this.cachedImage(value.original.gUrl);
        const thumbnail = this.cachedImage(value.thumbnail.gUrl);
        const compressed = this.cachedImage(value.compressed.gUrl);
        const type = value.type;
        const src = loadGradually ? original : compressed;
        const thumb = loadGradually ? compressed : thumbnail;
        return <Partial<ImageItemData>>{ src, thumb, type };
      })
    )
  }

  transformArr(value: Partial<FirebaseFile>[], forceHighQuality: boolean = false) {
    return this.loadGradually$.pipe(
      map(loadGradually => loadGradually ||= forceHighQuality),
      map(loadGradually => value.map(v => {
        const original = this.cachedImage(v.original.gUrl);
        const thumbnail = this.cachedImage(v.thumbnail.gUrl);
        const compressed = this.cachedImage(v.compressed.gUrl);
        const type = v.type;
        const src = loadGradually ? original : compressed;
        const thumb = loadGradually ? compressed : thumbnail;
        return <Partial<ImageItemData>>{ src, thumb, type };
      }))
    )
  }
}
