import { ApplicationRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { concatMap, map, take } from 'rxjs/operators';
import { AuthService } from 'src/business/services/auth.service';
import { ManualChangeDetection } from 'src/business/utils/manual-change-detection.util';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(
    private readonly authSvc: AuthService,
    private readonly dialog: MatDialog,
    private readonly applicationRef: ApplicationRef,
  ) {
    ManualChangeDetection.STATIC_APPLICATION_REF = applicationRef;
  }

  private readonly _subsink = new SubSink();

  /**
   * HOLDS VERY IMPORTANT LOGIC FOR AUTH
   * HAD TROUBLES signing in through FACEBOOK & INSTAGRAM mobile applications
   * Since they open their own little browser signInWithPopup had some flaws and resulted in blank screen
   *
   * Cure is probably signInWithRedirect but it needs special handling
   * */
  ngOnInit(): void {
    // this.authSvc.completeSocialLogin();

    this._subsink.add(
      this.authSvc.userDbInfo$
      .pipe(
        concatMap(userDbInfo => this.authSvc.user$.pipe(take(1), map(userAuthInfo => [userAuthInfo, userDbInfo])))
      )
      .subscribe(
        async ([userAuthInfo, userDbInfo]) => {

          console.log(userAuthInfo, userDbInfo, this.authSvc.emailLoginInProgress);

          if(!userDbInfo) return;

          if(this.authSvc.emailLoginInProgress) return;

          if(userDbInfo.code == "registration-not-complete") {
            return await this.authSvc.registerUserComplete(userAuthInfo.uid, userAuthInfo.email).toPromise();
          }

          if(userDbInfo.overrideEmail) {
            return this.authSvc.openChangeEmailDialog(userDbInfo.overrideEmail.reason, true);
          }

          if(!userDbInfo.email || userDbInfo.email?.trim() == "") {
            return this.authSvc.openChangeEmailDialog("Nažalost nemate konfiguriran ispravan e-mail. Molimo vas da promjenite e-mail.", true);
          }
        }
      )
    )
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }


}
