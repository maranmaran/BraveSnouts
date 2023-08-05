import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Renderer2, RendererStyleFlags2, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
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
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, MatToolbarModule, MatDialogModule, MatMenuModule, MatIconModule, MatTabsModule]
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
    this.initTabs();
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


  readonly renderer = inject(Renderer2)

  private initTabs() {
    this._subsink.add(
      // gallery tabs
      this.itemScrollViewSvc.view$
        .pipe(
          filter(() => !!this.galleryTabs),
          distinctUntilChanged()
        )
        .subscribe((view) => {
          const element = this.galleryTabs._elementRef.nativeElement;
          const shouldShow = this.router.url.indexOf('moji-predmeti') != -1
          if (shouldShow) {
            this.renderer.setStyle(element, 'display', 'none', RendererStyleFlags2.Important);
          } else {
            this.renderer.setStyle(element, 'display', 'block', RendererStyleFlags2.Important);
          }

          this.galleryTabs.selectedIndex = view == 'grid' ? 0 : 1;
          this.galleryTabs.realignInkBar();
        })

    );
  }

  @ViewChild('galleryTabs', { static: false }) galleryTabs?: MatTabGroup;
  onGalleryTabChange(event: MatTabChangeEvent) {
    if (!event) return;

    this.itemScrollViewSvc.switchTab(event.tab.textLabel);
    if (this.galleryTabs) {
      this.galleryTabs.selectedIndex = event.index;
      this.galleryTabs.realignInkBar();
    }
  }
}
