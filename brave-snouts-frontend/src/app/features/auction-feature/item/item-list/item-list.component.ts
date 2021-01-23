import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { QueryFn, DocumentData } from '@angular/fire/firestore';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs/internal/Observable';
import { distinctUntilChanged, filter, map, take, tap } from 'rxjs/operators';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { AuctionItemRepository } from 'src/business/services/auction-item.repository';
import { ProgressBarService } from 'src/business/services/progress-bar.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  constructor(
    private readonly itemsRepo: AuctionItemRepository,
    private readonly loadingSvc: ProgressBarService,
    private readonly mediaObs: MediaObserver,
  ) { }

  // Input data and user info
  @Input('auctionId') auctionId: string;
  
  items$: Observable<AuctionItem[]>;

  bufferAmount = 5;

  private _subsink = new SubSink();
  
  ngOnInit(): void {
    
    this.items$ = this.getItems();

    this._subsink.add(
      this.onMediaChangeUpdateBufferAmount()
    )

    // sim loading
    // this.loadingSvc.active$.next(true);
    // setTimeout(_ => this.loadingSvc.active$.next(false), 1000);
  }

  getItems() {
    
    this.loadingSvc.active$.next(true);

    let query: QueryFn<DocumentData> = ref => ref.orderBy("name", 'asc');
    
    return this.itemsRepo.getAll(this.auctionId, query)
      .pipe(take(1), tap(() => this.loadingSvc.active$.next(false)));
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }
  
  trackByFn(_, item) {
    return item.id;
  }

  /** When window size changes and grid follows it we need
   * to update amount of items the virtual scroll will pre-render in adavance
   * so user experience is better 
   * (People won't see items appearing and will have smoother scroll experience) */  
  onMediaChangeUpdateBufferAmount() {
    return this.mediaObs.asObservable()
    .pipe(
      filter((changes: MediaChange[]) => changes.length > 0),
      map((changes: MediaChange[]) => changes[0]),
      distinctUntilChanged((prev, cur) => prev.mqAlias == cur.mqAlias)
    ).subscribe((change: MediaChange) => {

      switch (change.mqAlias) {
        case "xl":
          this.bufferAmount = 20;
          break;
        case "lg":
          this.bufferAmount = 15;
          break;
        case "md":
          this.bufferAmount = 10;
          break;
        case "sm":
          this.bufferAmount = 5;
          break;
        default:
          this.bufferAmount = 5;
          break;
        }

    });
  }


}
