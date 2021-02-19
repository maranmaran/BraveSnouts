import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/business/services/auth.service';
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
  ) {
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
    this.authSvc.completeSocialLogin();

    this._subsink.add(
      this.authSvc.userDbInfo$.subscribe(
        (info: any) => {

          if(info.overrideEmail) {
            this.authSvc.openChangeEmailDialog(info.overrideEmail.reason, true);
          }
          if(!info.email || info.email?.trim() == "") {
            this.authSvc.openChangeEmailDialog("Nažalost nemate konfiguriran ispravan e-mail. Molimo vas da promjenite e-mail.", true);
          }
        }
      )
    )
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }


}
