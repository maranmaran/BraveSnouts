import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { HotToastService } from '@ngneat/hot-toast';
import { noop } from 'rxjs';
import { take } from 'rxjs/operators';
import { HandoverDialogComponent } from 'src/app/features/auction-feature/delivery/handover-dialog/handover-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { Auction } from 'src/business/models/auction.model';
import { WinnerOnAuction } from 'src/business/models/winner.model';
import { FunctionsService } from 'src/business/services/functions.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { SubSink } from 'subsink';
import { ProgressBarService } from './../../../../../business/services/progress-bar.service';
import { WinnersRepository } from './../../../../../business/services/repositories/winners.repository';
import { StorageService } from './../../../../../business/services/storage.service';
import { WinnerDetailsDialogComponent } from './../winner-details-dialog/winner-details-dialog.component';

@Component({
  selector: 'app-admin-auctions-page',
  templateUrl: './admin-auctions-page.component.html',
  styleUrls: ['./admin-auctions-page.component.scss'],
  providers: [
    AuctionItemRepository,
    AuctionRepository,
    WinnersRepository,
    FunctionsService,
  ],
})
export class AdminAuctionsPageComponent implements OnInit {
  displayedColumns: string[] = ['select', 'name', 'processed'];
  dataSource = new MatTableDataSource<Auction>([]);
  selection = new SelectionModel<Auction>(true, []);

  @ViewChild('table', { static: false }) table: MatTable<Auction>;

  constructor(
    public readonly mediaObs: MediaObserver,
    private readonly auctionRepo: AuctionRepository,
    private readonly itemsRepo: AuctionItemRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly functionsSvc: FunctionsService,
    private readonly dialog: MatDialog,
    private readonly toastSvc: HotToastService,
    private readonly storage: StorageService,
    private readonly loadingSvc: ProgressBarService
  ) {}

  private _subsink = new SubSink();

  async ngOnInit() {
    this._subsink.add(this.getAuctions());
  }

  /** Gets all auctions */
  getAuctions() {
    let query = (ref) => ref.where('archived', '==', false); // @see {sortAdminAuctions (auction-list.component.ts)}
    return this.auctionRepo.getAll(query).subscribe(
      (auctions) => {
        this.dataSource.data = auctions;
        this.table.renderRows();
        this.updateSelectionModel(this.dataSource.data);
      },
      (err) => console.log(err)
    );
  }

  /** Whether or not only processeed auctions have been selected */
  public get onlyProcessedAuctionsSelected(): boolean {
    return this.selection.selected
      .map((a) => a.processed)
      .reduce((prev, cur) => (cur &&= prev), true);
  }

  //#region Actions

  async onCloseAuctions() {
    const handoverDetails = await this.getHandoverDetails();
    if (!handoverDetails) return;

    for (const auction of this.selection.selected) {
      let endAuction$ = this.functionsSvc
        .endAuction(auction.id, handoverDetails)
        .pipe(
          take(1),
          this.toastSvc.observe({
            loading: `Zatvaranje "${auction.name}"..`,
            success: `Uspješno zatvorena "${auction.name}"`,
            error: `Nešto je pošlo po zlu sa zatvaranjem "${auction.name}"`,
          })
        );
      await endAuction$.toPromise().catch((err) => console.log(err));
    }
  }

  async onSendWinnerMails() {
    const auctionIds = this.selection.selected.map((x) => x.id);
    const handoverDetails = this.selection.selected.map(
      (x) => x.handoverDetails
    );

    let allDetailsAreSame = true;
    for (let i = 1; i < handoverDetails.length; i++) {
      if (handoverDetails[i].join('') != handoverDetails[i - 1].join('')) {
        allDetailsAreSame = false;
        break;
      }
    }

    if (!allDetailsAreSame) {
      this.toastSvc.warning(
        'Detalji preuzimanje nisu isti za sve označene aukcije',
        { dismissible: true, duration: 20000 }
      );
      this.toastSvc.warning(
        'Zatvori trenutno označene aukcije ponovno i ponovi ovu akciju',
        { dismissible: true, duration: 20000 }
      );
    }

    let confirmAnswer = await this.confirmDialog(
      'Sigurno želiš poslati pobjedničke mailove trenutno označenim aukcijama?'
    );
    if (!confirmAnswer) return;

    this.functionsSvc
      .sendWinnerMails(auctionIds, handoverDetails[0])
      .pipe(
        take(1),
        this.toastSvc.observe({
          loading: 'Šaljem mailove..',
          success: 'Uspješno poslani mailovi',
          error: 'Nešto je pošlo po zlu',
        })
      )
      .subscribe(noop, (err) => console.log(err));
  }

  async onChangeHandoverDetails() {
    const handoverDetails = await this.getHandoverDetails();
    if (!handoverDetails) return;

    this.functionsSvc
      .changeHandoverDetails(
        this.selection.selected.map((a) => a.id),
        handoverDetails
      )
      .pipe(
        take(1),
        this.toastSvc.observe({
          loading: `Šaljem mailove`,
          success: `Uspješna izmjena`,
          error: `Nešto je pošlo po zlu`,
        })
      )
      .subscribe(noop, (err) => console.log(err));
  }

  onDownloadExcelTable() {
    const fileName = window.prompt(
      'Unesi naziv exportane datoteke, prazno za default',
      ''
    );
    this.functionsSvc
      .exportAuction(
        this.selection.selected.map((a) => a.id),
        fileName
      )
      .pipe(
        take(1),
        this.toastSvc.observe({
          loading: `Pripremam excel`,
          success: `Uspješno`,
          error: `Nešto je pošlo po zlu`,
        })
      )
      .subscribe(
        (res) => (window.location.href = res[1].mediaLink),
        (err) => console.log(err)
      );
  }

  async onShowWinners() {
    this.loadingSvc.active$.next(true);
    let winners = new Map<
      string,
      { winner: WinnerOnAuction; auctionIds: Set<string> }
    >();
    for (const auction of this.selection.selected) {
      const winnerDocs = await this.winnersRepo
        .getAuctionWinners(auction.id)
        .pipe(take(1))
        .toPromise();
      for (const winner of winnerDocs) {
        if (winners.has(winner.id)) {
          let current = winners.get(winner.id);
          !current.auctionIds.has(auction.id) &&
            current.auctionIds.add(auction.id);
          current.winner.bids.push(...winner.bids);
          current.winner.items.push(...winner.items);
          winners.set(winner.id, current);
        } else {
          winners.set(winner.id, {
            winner: winner,
            auctionIds: new Set<string>([auction.id]),
          });
        }
      }
    }
    this.loadingSvc.active$.next(false);

    this.dialog.open(WinnerDetailsDialogComponent, {
      maxHeight: '80vh',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['dialog', 'no-padding', 'winners-admin-auctions-dialog'],
      data: { winners },
    });
  }

  onDownloadMails() {
    this.functionsSvc
      .downloadMails()
      .pipe(
        take(1),
        this.toastSvc.observe({
          loading: `Pripremam excel`,
          success: `Uspješno`,
          error: `Nešto je pošlo po zlu`,
        })
      )
      .subscribe(
        (res) => (window.location.href = res[1].mediaLink),
        (err) => console.log(err)
      );
  }

  //#endregion

  //#region Dialog helpers

  getHandoverDetails() {
    const dialogRef = this.dialog.open(HandoverDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'restrict-height-handover',
    });

    return dialogRef.afterClosed().pipe(take(1)).toPromise();
  }

  confirmDialog(text: string, yes = 'Želim', no = 'Ne želim') {
    let dialogRef = this.dialog.open(ConfirmDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: true,
      data: { text, yes, no },
    });

    return dialogRef
      .afterClosed()
      .pipe(take(1))
      .toPromise() as Promise<boolean>;
  }

  //#endregion

  //#region Selection helpers

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /**Updates selection model object references with new ones */
  updateSelectionModel(auctions: Auction[]) {
    let newModel = new SelectionModel<Auction>(true, []);

    for (const model of this.selection.selected) {
      let idx = auctions.findIndex((x) => x.id == model.id);
      newModel.select(auctions[idx]);
    }

    this.selection = newModel;
  }

  //#endregion
}
