import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuctionItem } from 'src/business/models/auction-item.model';
import { ItemDialogService } from 'src/business/services/item-dialog.service';
import { AuctionItemRepository } from 'src/business/services/repositories/auction-item.repository';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss'],
  providers: [AuctionItemRepository]
})
export class SingleItemComponent implements OnInit, OnDestroy {

  @Input() item$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  @Input() fromDialog: boolean = false;

  private readonly _subsink = new SubSink();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly itemRepo: AuctionItemRepository,
  ) { }

  ngOnInit(): void {

    setTimeout(() => {
      if(!this.fromDialog) {
        const auctionId = this.route.snapshot.paramMap.get('auctionId');
        const itemId = this.route.snapshot.paramMap.get('itemId');
    
        if(!auctionId || !itemId) {
          this.router.navigate(['/app']);
        } else {
          this._subsink.add(
            this.itemRepo.getOne(auctionId, itemId).subscribe(
              item => {
                this.item$.next(item);
              }
            )
          )

        } 
      }
    })
  
  }

  ngOnDestroy(): void {
    this._subsink.unsubscribe();
  }

}
