import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageItemData } from 'ng-gallery';
import { combineLatest, map, shareReplay } from 'rxjs';
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

  protected loadFullResolution$ = this.settingsSvc.settings$.pipe(
    map(x => x.loadFullResolution),
    shareReplay(1)
  );

  protected loadGradually$ = this.settingsSvc.settings$.pipe(
    map(x => x.gradualImageLoading),
    shareReplay(1)
  );

  private cachedImage(url: string) {
    return url + '?cacheKey=' + this.imageCacheSeed
  }

  transform(value: Partial<FirebaseFile>, forceHighQuality: boolean = false) {
    return combineLatest([
      this.loadGradually$,
      this.loadFullResolution$
    ])
      .pipe(
        map(([loadGradually, loadFullResolution]) => {
          loadGradually ||= forceHighQuality
          return [loadGradually, loadFullResolution]
        }),
        map(([loadGradually, loadFullResolution]) => {
          const original = this.cachedImage(value.original.gUrl);
          const thumbnail = this.cachedImage(value.thumbnail.gUrl);
          const compressed = this.cachedImage(value.compressed.gUrl);
          const type = value.type;

          if (loadFullResolution) {
            return <Partial<ImageItemData>>{
              src: original,
              thumb: original,
              type
            };
          }

          const src = loadGradually ? original : compressed;
          const thumb = loadGradually ? compressed : thumbnail;
          return <Partial<ImageItemData>>{ src, thumb, type };
        })
      )
  }

  transformArr(value: Partial<FirebaseFile>[], forceHighQuality: boolean = false) {
    return combineLatest([
      this.loadGradually$,
      this.loadFullResolution$
    ])
      .pipe(
        map(([loadGradually, loadFullResolution]) => {
          loadGradually ||= forceHighQuality
          return [loadGradually, loadFullResolution]
        }),
        map(([loadGradually, loadFullResolution]) => value.map(v => {
          const original = this.cachedImage(v.original.gUrl);
          const thumbnail = this.cachedImage(v.thumbnail.gUrl);
          const compressed = this.cachedImage(v.compressed.gUrl);
          const type = v.type;

          if (loadFullResolution) {
            return <Partial<ImageItemData>>{
              src: original,
              thumb: original,
              type
            };
          }

          const src = loadGradually ? original : compressed;
          const thumb = loadGradually ? compressed : thumbnail;
          return <Partial<ImageItemData>>{ src, thumb, type };
        }))
      )
  }
}
