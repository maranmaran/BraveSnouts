import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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

  public winnersMap: Map<WinnerOnAuction, Set<string>>;
  public winners: WinnerOnAuction[] = [];

  constructor(
    private readonly dialog: MatDialog,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly dialogRef: MatDialogRef<WinnerDetailsDialogComponent>,
    private readonly firestore: AngularFirestore, // argh cutting corners cuz i'm too lazy
    @Inject(MAT_DIALOG_DATA) public data: { winners: Map<string, { winner: WinnerOnAuction, auctionIds: Set<string> }> }
  ) {
  }

  ngOnInit(): void {
    this.winnersMap = new Map<WinnerOnAuction, Set<string>>();
    for (const val of this.data.winners.values()) {
      this.winnersMap.set(val.winner, val.auctionIds);
    }

    let sortedEntries = [...this.winnersMap.entries()].sort(([a, b], [c, d]) => a.userInfo.name > c.userInfo.name ? 1 : -1);
    this.winnersMap = new Map<WinnerOnAuction, Set<string>>(sortedEntries);

    this.winners.push(...this.winnersMap.keys());
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

    dialogRef.afterClosed().pipe(take(1)).subscribe()

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

    dialogRef.afterClosed().pipe(take(1)).subscribe()

  }

  getTotalDonations(winner: WinnerOnAuction) {
    return winner.items.map(item => item.bid).reduce((prev, cur) => prev += cur, 0);
  }

  async markPaymentStatus(change: MatButtonToggleChange, winner: WinnerOnAuction) {
    const paymentStatus = change.value as 'paid' | 'pending' | 'notpaid';
    let auctionIds = this.winnersMap.get(winner);

    for (const auctionId of auctionIds) {
      this.winnersRepo.updateAuctionWinner(auctionId, winner.id, { paymentStatus });

      let items = winner.items.filter(x => x.auctionId == auctionId);
      for (const item of items) {
        this.firestore.doc(`auctions/${auctionId}/items/${item.id}`).set({ winner: { paymentStatus } }, { merge: true });
      }
    }
  }

  async markPackedState(change: MatButtonToggleChange, winner: WinnerOnAuction) {
    const packed = change.value as 'yes' | 'no' | null | undefined;
    let auctionIds = this.winnersMap.get(winner);

    for (const auctionId of auctionIds) {
      this.winnersRepo.updateAuctionWinner(auctionId, winner.id, { packed });

      let items = winner.items.filter(x => x.auctionId == auctionId);
      for (const item of items) {
        this.firestore.doc(`auctions/${auctionId}/items/${item.id}`).set({ winner: { packed } }, { merge: true });
      }
    }
  }

  openWonItems(items: AuctionItem[]) {

    let message = "<ul>";
    for (const item of items) {
      message += `<li>${item.name} - ${item.description?.replace(/<[^>]*>?/gm, '') ?? 'Nema opisa'}</li>`;
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

  trackByFn(_: number, winner: WinnerOnAuction) {
    return winner.id;
  }

}
