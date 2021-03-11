import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { noop } from 'rxjs';
import { take } from 'rxjs/operators';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { WinnerOnAuction } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { WinnersRepository } from 'src/business/services/repositories/winners.repository';
import { PostDetailsComponent } from '../../delivery/post-details/post-details.component';
import { AuctionRepository } from './../../../../../business/services/repositories/auction.repository';

@Component({
  selector: 'app-winner-details-dialog',
  templateUrl: './winner-details-dialog.component.html',
  styleUrls: ['./winner-details-dialog.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository, WinnersRepository]
})
export class WinnerDetailsDialogComponent implements OnInit {

  private _auctionId: string;
  public winners: WinnerOnAuction[];

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly dialogRef: MatDialogRef<WinnerDetailsDialogComponent>,
    private readonly firestore: AngularFirestore, // argh cutting corners cuz i'm too lazy
    @Inject(MAT_DIALOG_DATA) public data: { winners, auctionId }
  ) { }

  ngOnInit(): void {
    this._auctionId = this.data.auctionId;
    this.winners = this.data.winners;
  }

  onClose() {
    this.dialogRef.close();
  }


  openPostalInformation(data) {

    const dialogRef = this.dialog.open(PostDetailsComponent, {
      height: 'auto',
      width: 'auto',
      maxWidth: '98%',
      autoFocus: false,
      closeOnNavigation: true,
      data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(noop, err => console.log(err))

  }

  openHandoverInformation(data) {

    const dialogRef = this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: 'auto',
      maxWidth: '98%',
      autoFocus: false,
      closeOnNavigation: true,
      data
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe(noop, err => console.log(err))

  }

  getTotalDonations(winner: WinnerOnAuction) {
    return winner.items.map(item => item.bid).reduce((prev, cur) => prev += cur, 0);
  }

  async markPaymentStatus(change: MatButtonToggleChange, winner: WinnerOnAuction) {
    const paymentStatus = change.value as 'paid' | 'pending' | 'notpaid';

    this.winnersRepo.updateAuctionWinner(winner.auctionId, winner.id, { paymentStatus });

    for(const item of winner.items) {
      this.firestore.doc(`auctions/${winner.auctionId}/items/${item.id}`).set({ winner: { paymentStatus } }, { merge: true });
    }
  }

  openWonItems(items: AuctionItem[]) {

    let message = "<ul>";
    for(const item of items) {
      message += `<li>${item.name} - ${item.description?.replace(/<[^>]*>?/gm, '') ?? 'Nema opisa' }</li>`;
    }
    message += "</ul>"

    this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8', 'full-width'],
      data: message
    });
  }

}
