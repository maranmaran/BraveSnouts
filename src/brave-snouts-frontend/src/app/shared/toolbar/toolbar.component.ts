import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { addDays } from 'date-fns';
import 'firebase/auth';
import { noop } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { SupportComponent } from 'src/app/shared/support/support.component';
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
    private readonly router: Router,
    private readonly loadingSvc: ProgressBarService,
    private readonly dialog: MatDialog,
    public readonly itemScrollViewSvc: ItemScrollViewService
  ) { }

  user$ = this.authSvc.user$;
  admin$ = this.authSvc.isAdmin$;
  active$ = this.loadingSvc.active$;
  userInfo$ = this.authSvc.getUserInformation();

  private _subsink = new SubSink();

  ngOnInit(): void {
    this._subsink.add(
      this.itemScrollViewSvc.view$
        .pipe(
          filter(() => !!this.viewTabs),
          distinctUntilChanged()
        )
        .subscribe((view) => {
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
      .navigate(['/aukcije'])
      .then((_) => setTimeout((_) => (this.clickFlag = false), 1000));
  }

  public get rootRoute() {
    return this.router.url === '/';
  }

  onCreateAuction() {
    let auction = {
      name: 'Aukcija',
      startDate: new Date(),
      endDate: addDays(new Date(), 1).getDate(),
    };

    this.router.navigate(['/aukcije/kreiranje-aukcije'], {
      state: { auction, items: [], action: 'create' },
    });
  }

  onCreateAuctionThroughImages() {
    this.router.navigate(['/aukcije/kreiranje-aukcije-sa-ucitavanjem-slika']);
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
