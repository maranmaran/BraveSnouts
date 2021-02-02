import { Route } from '@angular/compiler/src/core';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { User } from 'src/business/models/user.model';

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
    private store: AngularFirestore
  ) { }

  ngOnInit(): void {
    let userId = this.route.snapshot.paramMap.get('userId');
    this.optout = this.route.snapshot.paramMap.get('optout');

    if(!userId || !this.optout) {
      return;
    }

    let update: any;
    switch (this.optout) {
      case "acountannouncements":
        update = {
          emailSettings: {
            auctionAnnouncements: false
          }
        }
        break;
      case "bidchange":
        update = {
          emailSettings: {
            bidUpdates: false
          }
        }
        break;
    
      default:
        break;
    }

    this.store.collection("users").doc(userId).update(update)
    .then(() => this.success = true)
    .catch(err => (console.log(err), this.success = false))
    .finally(() => this.bootstrap = true);
  }

}
