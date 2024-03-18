import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl } from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import { Subject, firstValueFrom, from, noop } from 'rxjs';
import { first, map, skip, take, takeUntil } from 'rxjs/operators';
import { EmailSettings, User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';

/**
 * TODO: This is actually not email optout confirmation anymore but notification management component for user
 */
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
    private store: AngularFirestore,
    private authSvc: AuthService,
    private toastSvc: HotToastService
  ) { }

  async ngOnInit() {
    // verify login
    const isAuth = await firstValueFrom(this.authSvc.isAuthenticated$);

    let user = null;
    if (!isAuth) {
      user = await firstValueFrom(this.authSvc.login().pipe(map((cred) => (cred as any).user)));
    } else {
      user = await firstValueFrom(this.authSvc.getUserInformation());
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

  ngOnDestroy() {
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
          console.error(err), (this.bootstrap = true), (this.success = false)
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
