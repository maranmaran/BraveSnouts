import { Component, ElementRef, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { noop, Observable } from 'rxjs';
import { AuthService } from 'src/business/services/auth.service';
import firebase from 'firebase/app';
import { MediaObserver } from '@angular/flex-layout';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { Auction } from 'src/business/models/auction.model';
import * as moment from 'moment';
import { User } from 'src/business/models/user.model';

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
    private readonly loadingSvc: ProgressBarService
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

  onLogin() {
    this.authSvc.login().subscribe(noop);
  }

  onLogout() {
    this.authSvc.logout();
  }
    
}
