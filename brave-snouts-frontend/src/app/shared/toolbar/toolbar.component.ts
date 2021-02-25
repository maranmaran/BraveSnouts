import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import * as moment from 'moment';
import { noop, Observable } from 'rxjs';
import { SupportComponent } from 'src/app/shared/support/support.component';
import { User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  providers: [],
})
export class ToolbarComponent implements OnInit {

  constructor(
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
    private readonly router: Router,
    private readonly loadingSvc: ProgressBarService,
    private readonly dialog: MatDialog
  ) { }

  user$: Observable<firebase.User | null>;
  userInfo$: Observable<User | null>;
  admin$: Observable<boolean>;
  active$: Observable<boolean>; // whether or not progress bar is active

  ngOnInit(): void {
    this.user$ = this.authSvc.user$
    this.admin$ = this.authSvc.isAdmin$;
    this.active$ = this.loadingSvc.active$;
    this.userInfo$ = this.authSvc.getUserInformation();
  }

  clickFlag = false;
  onLogoHover(mouseEnter) {
    if(this.rootRoute)
      return;

    this.clickFlag = mouseEnter;
  }

  onLogoClick() {
    if(this.rootRoute)
      return;

    this.clickFlag = true;

    this.router.navigate(['/app']).then(
      _ => setTimeout(_ => this.clickFlag = false, 1000)
    );
  }

  public get rootRoute()  {
    return this.router.url === '/';
  }

  onCreateAuction() {
    let auction = {
      name: 'Aukcija',
      startDate: new Date(),
      endDate: moment(new Date()).add(1, 'day').toDate()
    };

    this.router.navigate(['/app/create-auction'], { state: { auction, items: [], action: 'create' } })
  }

  onCreateAuctionThroughImages() {
    this.router.navigate(['/app/create-auction-bulk-image-upload'])
  }

  onShowContactHelp(){
    this.dialog.open(SupportComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '23rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: "dialog-no-padding"
    });
  }

  onChangeEmail() {
    this.authSvc.openChangeEmailDialog(null);
  }

  onLogin() {
    this.authSvc.login().subscribe(noop);
  }

  onLogout() {
    this.authSvc.logout();
  }

}
