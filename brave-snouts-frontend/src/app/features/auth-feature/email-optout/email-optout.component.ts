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

  ngOnInit(): void {
    let userId = this.route.snapshot.paramMap.get('userId');
    this.optout = this.route.snapshot.paramMap.get('optout');

    if(!userId || !this.optout) {
      return;
    }

    this.authSvc.login()
    .pipe(take(1))
    .subscribe(user => {

      if(user) {

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
  
        })
        
      }

    });

  }

}
