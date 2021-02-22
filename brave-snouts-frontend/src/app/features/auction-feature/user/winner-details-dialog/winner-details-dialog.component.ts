import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { noop } from 'rxjs';
import { take } from 'rxjs/operators';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { WinnerOnAuction } from 'src/business/models/winner.model';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { PostDetailsComponent } from '../../delivery/post-details/post-details.component';
import { AuctionRepository } from './../../../../../business/services/repositories/auction.repository';

@Component({
  selector: 'app-winner-details-dialog',
  templateUrl: './winner-details-dialog.component.html',
  styleUrls: ['./winner-details-dialog.component.scss'],
  providers: [AuctionRepository, AuctionItemRepository]
})
export class WinnerDetailsDialogComponent implements OnInit {

  private _auctionId: string;
  public winners: WinnerOnAuction[];

  constructor(
    private readonly dialog: MatDialog,
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly dialogRef: MatDialogRef<WinnerDetailsDialogComponent>,
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

  async markPaymentStatus(change: MatButtonToggleChange, winner: Winner) {
    alert("Implement")
    return;
    // const paymentStatus = change.value as 'paid' | 'pending' | 'notpaid';

    // const winnerUpdate = Object.assign({}, winner, { paymentStatus });
    // const partialUpdate: Partial<AuctionItem> = { winner: winnerUpdate } ;

    // await this.itemsRepo.update(this._auctionId, winner.itemId, partialUpdate);
    // await this.
  }

}
