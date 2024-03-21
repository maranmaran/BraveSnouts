import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { HotToastService } from '@ngxpert/hot-toast';
import { combineLatest, firstValueFrom, from, noop } from 'rxjs';
import { first, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { HandoverDialogComponent } from 'src/app/features/auction-feature/delivery/handover-dialog/handover-dialog.component';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { Auction } from 'src/business/models/auction.model';
import { WinnerOnAuction } from 'src/business/models/winner.model';
import { AuthService } from 'src/business/services/auth.service';
import { FunctionsService } from 'src/business/services/functions.service';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { AuctionRepository } from 'src/business/services/repositories/auction.repository';
import { WinnersRepository } from 'src/business/services/repositories/winners.repository';
import { SettingsService } from 'src/business/services/settings.service';
import { SubSink } from 'subsink';
import { WinnerDetailsDialogComponent } from '../winner-details-dialog/winner-details-dialog.component';

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
  displayedColumns: string[] = ['select', 'name', 'processed', 'handover', 'lastWinningMails'];
  dataSource = new MatTableDataSource<Auction>([]);
  selection = new SelectionModel<Auction>(true, []);

  @ViewChild('table', { static: false }) table: MatTable<Auction>;

  constructor(
    private readonly authSvc: AuthService,
    private readonly auctionRepo: AuctionRepository,
    private readonly winnersRepo: WinnersRepository,
    private readonly functionsSvc: FunctionsService,
    private readonly dialog: MatDialog,
    private readonly toastSvc: HotToastService,
    private readonly loadingSvc: ProgressBarService,
    private readonly settingsSvc: SettingsService
  ) { }

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
      }
    );
  }

  /** Whether or not only processeed auctions have been selected */
  public get onlyProcessedAuctionsSelected(): boolean {
    return this.selection.selected
      .map((a) => a?.processed)
      .reduce((prev, cur) => (cur &&= prev), true);
  }

  //#region Actions

  async onCloseAuctions() {
    const handoverDetails = await this.getHandoverDetails();
    if (!handoverDetails) return;

    if (!await this.confirmDialog('Sigurno želiš zatvoriti označene aukcije?')) {
      return;
    }

    const nonProcessed = this.selection.selected.filter(x => x.processed == false);
    for (const auction of nonProcessed) {
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

      await firstValueFrom(endAuction$);
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

    if (!await this.confirmDialog('Sigurno želiš poslati pobjedničke mailove trenutno označenim aukcijama?')) {
      return;
    }

    const alreadySent = this.selection.selected.filter(x => !!x.lastTimeWinningMailsSent);
    if (alreadySent) {
      const answer = confirm('Označio/la si aukcije za koje su već poslani pobjednički mailovi? Sigurno želiš nastaviti?');
      if (!answer) {
        return;
      }
    }

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
      .subscribe(noop);
  }

  async onChangeHandoverDetails() {
    const handoverDetails = await this.getHandoverDetails();
    if (!handoverDetails) return;

    if (!await this.confirmDialog('Sljedeći dijalog će sudionicima poslati mail s promjenama mjesta preuzimanja. Nastaviti?')) {
      return;
    }

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
      .subscribe();
  }

  async onArchiveAuction() {
    if (!await this.confirmDialog('Sigurno želiš arhivirati aukciju?')) {
      return;
    }

    const auctions = [...this.selection.selected];
    this.selection.deselect(...auctions);

    from(auctions)
      .pipe(
        this.toastSvc.observe({
          loading: `Arhiviram`,
          success: `Uspješno`,
          error: `Nešto je pošlo po zlu`,
        }),
        mergeMap(a => {
          return this.auctionRepo.update(a.id, { archived: true });
        })
      ).subscribe(noop);
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
      .subscribe(res => (window.location.href = res[1].mediaLink));
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
      .subscribe(res => (window.location.href = res[1].mediaLink));
  }

  onSendTestMail() {
    combineLatest([
      this.settingsSvc.settings$.pipe(first()),
      this.authSvc.user$.pipe(first())
    ]).pipe(
      first(),
      this.toastSvc.observe({
        loading: `Slanje test maila`,
        success: `Uspješno"`,
        error: `Nešto je pošlo po zlu`,
      }),
      map(([settings, user]) => { return { email: settings.testing.email ?? user.email, itemsCount: settings.testing.itemsCount ?? 10 } }),
      switchMap(((data: { email: string, itemsCount: number }) =>
        this.functionsSvc.testAuctionMails(data.email, data.itemsCount)
      ))
    ).subscribe(noop);
  }

  onUpdateCatalog() {
    this.functionsSvc.updateCatalog().pipe(
      first(),
      this.toastSvc.observe({
        loading: `Ažuriranje kataloga trgovine`,
        success: `Uspješno"`,
        error: `Nešto je pošlo po zlu`,
      }),
    ).subscribe()
  }

  onUpdateAdoptionAnimals() {
    this.functionsSvc.updateAdoptionAnimals().pipe(
      first(),
      this.toastSvc.observe({
        loading: `Ažuriranje udomljavanja`,
        success: `Uspješno"`,
        error: `Nešto je pošlo po zlu`,
      }),
    ).subscribe()
  }

  onUpdateBlog() {
    this.functionsSvc.updateBlog().pipe(
      first(),
      this.toastSvc.observe({
        loading: `Ažuriranje bloga`,
        success: `Uspješno"`,
        error: `Nešto je pošlo po zlu`,
      }),
    ).subscribe()
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
