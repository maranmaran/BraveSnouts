import { ApplicationRef, Component } from '@angular/core';
import { combineLatest, firstValueFrom, startWith, zip } from 'rxjs';
import { AuthService } from 'src/business/services/auth.service';
import { ManualChangeDetection } from 'src/business/utils/manual-change-detection.util';
import { SubSink } from 'subsink';
import { AdoptApi } from './features/adopt-feature/adopt.api';
import { BlogApi } from './features/blog-feature/blog.api';
import { StoreApi } from './features/store-feature/store.api';
@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor(
    private readonly authSvc: AuthService,
    private readonly adoptApi: AdoptApi,
    private readonly blogApi: BlogApi,
    private readonly storeApi: StoreApi,
    readonly applicationRef: ApplicationRef,

  ) {
    // TODO: Review...I don't recall why I did this
    ManualChangeDetection.STATIC_APPLICATION_REF = applicationRef;
  }

  private readonly _subsink = new SubSink();

  ngOnInit() {
    this._subsink.add(
      this.listenLogin(),
      this.initContent()
    );
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  initContent() {
    return zip([
      this.storeApi.getProducts(),
      this.adoptApi.getAnimals(),
      this.blogApi.getPosts(),
    ]).subscribe()
    // .pipe(tap(console.log))
  }

  listenLogin() {
    return combineLatest([
      this.authSvc.user$.pipe(startWith(null)),
      this.authSvc.userDbInfo$,
    ]).subscribe(async ([userAuthInfo, userDbInfo]) => {

      if (!userDbInfo) return;
      if (this.authSvc.emailLoginInProgress) return;

      if (userDbInfo.code == 'registration-not-complete') {
        const providerId =
          userAuthInfo?.providerData[0]?.providerId ?? 'email';
        const signInMethod =
          userAuthInfo?.providerData[0]?.providerId ?? 'email';

        return await firstValueFrom(this.authSvc
          .registerUserComplete(
            userAuthInfo.uid,
            userAuthInfo.email,
            userAuthInfo.photoURL,
            providerId,
            signInMethod
          ));
      }

      if (userDbInfo.overrideEmail) {
        return this.authSvc.openChangeEmailDialog(
          userDbInfo.overrideEmail.reason,
          true
        );
      }

      if (userDbInfo.informUser) {
        return this.authSvc.informUser(userDbInfo.informUser.message);
      }

      if (!userDbInfo.email || userDbInfo.email?.trim() == '') {
        return this.authSvc.openChangeEmailDialog(
          'Nažalost nemate konfiguriran ispravan e-mail. Molimo vas da promjenite e-mail.',
          true
        );
      }
    })
  }
}
