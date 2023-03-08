import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Router } from '@angular/router';
import 'firebase/auth';
import firebase from 'firebase/compat/app';
import * as moment from 'moment';
import { MediaObserver } from 'ngx-flexible-layout';
import { noop, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SupportComponent } from 'src/app/shared/support/support.component';
import { User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';
import { ItemScrollViewService } from './../../features/auction-feature/item/item-gallery/item-scroll-view.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  providers: [],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  constructor(
    private readonly authSvc: AuthService,
    public readonly mediaObs: MediaObserver,
    private readonly router: Router,
    private readonly loadingSvc: ProgressBarService,
    private readonly dialog: MatDialog,
    public readonly itemScrollViewSvc: ItemScrollViewService
  ) { }

  user$: Observable<firebase.User | null>;
  userInfo$: Observable<User | null>;
  admin$: Observable<boolean>;
  active$: Observable<boolean>; // whether or not progress bar is active

  private _subsink = new SubSink();

  ngOnInit(): void {
    this.user$ = this.authSvc.user$;
    this.admin$ = this.authSvc.isAdmin$;
    this.active$ = this.loadingSvc.active$;
    this.userInfo$ = this.authSvc.getUserInformation();

    this._subsink.add(
      this.itemScrollViewSvc.view$
        .pipe(
          filter(() => !!this.viewTabs),
          distinctUntilChanged()
        )
        .subscribe((view) => {
          // console.log(view);
          this.viewTabs.selectedIndex = view == 'grid' ? 0 : 1;
          this.viewTabs?.realignInkBar();
        })
    );
  }

  ngOnDestroy() {
    this._subsink.unsubscribe();
  }

  clickFlag = false;
  onLogoHover(mouseEnter) {
    if (this.rootRoute) return;

    this.clickFlag = mouseEnter;
  }

  onLogoClick() {
    if (this.rootRoute) return;

    this.clickFlag = true;

    this.router
      .navigate(['/app'])
      .then((_) => setTimeout((_) => (this.clickFlag = false), 1000));
  }

  public get rootRoute() {
    return this.router.url === '/';
  }

  onCreateAuction() {
    let auction = {
      name: 'Aukcija',
      startDate: new Date(),
      endDate: moment(new Date()).add(1, 'day').toDate(),
    };

    this.router.navigate(['/app/create-auction'], {
      state: { auction, items: [], action: 'create' },
    });
  }

  onCreateAuctionThroughImages() {
    this.router.navigate(['/app/create-auction-bulk-image-upload']);
  }

  onShowContactHelp() {
    this.dialog.open(SupportComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '23rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'dialog-no-padding',
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

  @ViewChild('tabs', { static: false }) viewTabs?: MatTabGroup;
  onTabChange(event: MatTabChangeEvent) {
    if (!event) return;

    this.itemScrollViewSvc.switchTab(event.tab.textLabel);
    if (this.viewTabs) {
      this.viewTabs.selectedIndex = event.index;
      this.viewTabs.realignInkBar();
    }
  }
}
