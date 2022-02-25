import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-email-optout',
  templateUrl: './email-optout.component.html',
  styleUrls: ['./email-optout.component.scss'],
})
export class EmailOptoutComponent implements OnInit {
  success: boolean;
  bootstrap: boolean = false;

  optout: string;

  constructor(
    private route: ActivatedRoute,
    private store: AngularFirestore,
    private authSvc: AuthService
  ) { }

  async ngOnInit() {
    this.optout = this.route.snapshot.paramMap.get('optout');

    if (!this.optout) {
      return;
    }

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
    // if (currentId != userId) {
    //   this.bootstrap = true;
    //   this.success = false;
    //   return;
    // }

    // do optout
    this.store
      .collection('users')
      .doc(currentId)
      .valueChanges()
      .pipe(take(1))
      .subscribe(
        (user: User) => {
          let emailSettings = user.emailSettings;

          switch (this.optout) {
            case 'auctionannouncements':
              emailSettings.auctionAnnouncements = false;
              break;
            case 'bidchange':
              emailSettings.bidUpdates = false;
              break;

            default:
              break;
          }

          this.store
            .collection('users')
            .doc(currentId)
            .update({ emailSettings })
            .then(() => (this.success = true))
            .catch((err) => (console.log(err), (this.success = false)))
            .finally(() => (this.bootstrap = true));
        },
        (err) => (
          console.log(err), (this.bootstrap = true), (this.success = false)
        )
      );
  }
}
