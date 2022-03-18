import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HotToastService } from '@ngneat/hot-toast';
import { from, noop, Subject } from 'rxjs';
import { first, map, skip, take, takeUntil } from 'rxjs/operators';
import { User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';
import { EmailSettings } from './../../../../../../utilities/src/models';

@Component({
  selector: 'app-email-optout',
  templateUrl: './email-optout.component.html',
  styleUrls: ['./email-optout.component.scss'],
})
export class EmailOptoutComponent implements OnInit, OnDestroy {
  success: boolean;
  bootstrap: boolean = false;

  private ngUnsubscribeSubject = new Subject<void>();

  userId: string;

  emailSettings: EmailSettings;
  auctionAnnouncements = new FormControl(false);
  bidUpdates = new FormControl(false);

  constructor(
    private route: ActivatedRoute,
    private store: AngularFirestore,
    private authSvc: AuthService,
    private toastSvc: HotToastService
  ) { }

  async ngOnInit() {
    // verify login
    const isAuth = await this.authSvc.isAuthenticated$
      .pipe(take(1))
      .toPromise();

    let user = null;
    if (!isAuth) {
      user = await this.authSvc
        .login()
        .pipe(
          take(1),
          map((cred) => (cred as any).user)
        )
        .toPromise();
    } else {
      user = await this.authSvc.getUserInformation().pipe(take(1)).toPromise();
    }

    // verify wanted data

    if (!user) {
      this.bootstrap = true;
      this.success = false;
      return;
    }

    let currentId = user?.uid || user?.id;

    this.getSettings(currentId);

    this.bidUpdates.valueChanges.pipe(
      skip(1),
      takeUntil(this.ngUnsubscribeSubject)
    ).subscribe(async () => await this.updateSettings())

    this.auctionAnnouncements.valueChanges.pipe(
      skip(1),
      takeUntil(this.ngUnsubscribeSubject)
    ).subscribe(async () => await this.updateSettings())
  }

  ngOnDestroy(): void {
    this.ngUnsubscribeSubject.next();
    this.ngUnsubscribeSubject.complete();
  }

  private getSettings(userId: string) {
    this.store
      .collection('users')
      .doc(userId)
      .valueChanges()
      .pipe(take(1))
      .subscribe(
        (user: User) => {
          this.emailSettings = user.emailSettings;

          this.auctionAnnouncements.setValue(this.emailSettings.auctionAnnouncements);
          this.bidUpdates.setValue(this.emailSettings.bidUpdates);

          this.bootstrap = true;
          this.userId = userId;
        },
        (err) => (
          console.log(err), (this.bootstrap = true), (this.success = false)
        )
      );
  }

  async updateSettings() {

    this.emailSettings = {
      auctionAnnouncements: this.auctionAnnouncements.value,
      bidUpdates: this.bidUpdates.value
    };

    from(
      this.store
        .collection('users')
        .doc(this.userId)
        .update({ emailSettings: this.emailSettings })
    ).pipe(
      first(),
      this.toastSvc.observe({
        loading: { content: "Spremanje postavki", duration: 1000 },
        success: { content: "Uspješno spremljeno", duration: 1000 },
        error: { content: "Nešto je pošlo po zlu", duration: 1000 },
      }),
      takeUntil(this.ngUnsubscribeSubject))
      .subscribe(noop);
  }

}
