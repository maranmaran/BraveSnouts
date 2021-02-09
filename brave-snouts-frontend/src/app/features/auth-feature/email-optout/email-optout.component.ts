import { Route } from '@angular/compiler/src/core';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { noop, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { User } from 'src/business/models/user.model';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-email-optout',
  templateUrl: './email-optout.component.html',
  styleUrls: ['./email-optout.component.scss']
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
    let userId = this.route.snapshot.paramMap.get('userId');
    this.optout = this.route.snapshot.paramMap.get('optout');

    if(!userId || !this.optout) {
      return;
    }


    // verify login
    const isAuth = await this.authSvc.isAuthenticated$.toPromise();

    let user: User = null;
    if(!isAuth) {
      user = await this.authSvc.getUserInformation().toPromise();
    } else {
      user = await this.authSvc.login().toPromise();
    }

    // verify wanted data

    if(!user) {
      this.bootstrap = true;
      this.success = false;
      return;
    }

    if(user.id != userId) {
      this.bootstrap = true;
      this.success = false;
      return;
    }

    // do optout
    this.store.collection("users").doc(userId).valueChanges()
    .pipe(take(1))
    .subscribe((user: User) => {
      
      let emailSettings = user.emailSettings;

      switch (this.optout) {
        case "acountannouncements":
          emailSettings.auctionAnnouncements = false
          break;
        case "bidchange":
          emailSettings.bidUpdates = false
          break;
      
        default:
          break;
      }

      this.store.collection("users").doc(userId).update({ emailSettings })
      .then(() => this.success = true)
      .catch(err => (console.log(err), this.success = false))
      .finally(() => this.bootstrap = true);

    }, err => (console.log(err), this.bootstrap = true, this.success = false));

  }
        

}
