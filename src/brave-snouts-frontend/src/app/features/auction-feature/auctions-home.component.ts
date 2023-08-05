import { ApplicationRef, Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, firstValueFrom, startWith } from 'rxjs';
import { AuthService } from 'src/business/services/auth.service';
import { ManualChangeDetection } from 'src/business/utils/manual-change-detection.util';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-container',
  template: `
    <auctions-toolbar></auctions-toolbar>
    <router-outlet></router-outlet>
  `
})
export class AuctionsHomeComponent implements OnInit, OnDestroy {

  constructor(
    private readonly authSvc: AuthService,
    readonly applicationRef: ApplicationRef
  ) {
    // TODO: Maybe not needed
    ManualChangeDetection.STATIC_APPLICATION_REF = applicationRef;
  }

  private readonly _subsink = new SubSink();

  ngOnInit() {
    this._subsink.add(this.listenLogin())
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
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
