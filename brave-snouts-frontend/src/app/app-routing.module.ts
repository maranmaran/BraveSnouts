import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuctionBidsComponent } from 'src/app/features/auction-feature/auction/auction-bids/auction-bids.component';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
import { AuctionFormGuard } from 'src/business/guards/auction-form.guard';
import { AuthGuard } from 'src/business/guards/auth.guard';
import { AdminGuard } from 'src/business/guards/admin.guard';
import { Auction } from 'src/business/models/auction.model';
import { AuctionIdGuard } from 'src/business/guards/auction-id.guard';
import { AuctionActiveGuard } from 'src/business/guards/auction-active.guard';
import { PostConfirmComponent } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';
import { HandoverConfirmComponent } from 'src/app/features/auction-feature/delivery/handover-confirm/handover-confirm.component';

const routes: Routes = [
  { path: '', component: AuctionListComponent},

  { path: 'post-confirm', component: PostConfirmComponent },
  { path: 'handover-confirm', component: HandoverConfirmComponent },

  { path: 'create-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },
  { path: 'edit-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },  

  { path: 'auction',  canActivate: [AuctionIdGuard, AuctionActiveGuard], component: AuctionDetailsComponent }, 
  { path: 'bids', canActivate: [AdminGuard, AuctionIdGuard], component: AuctionBidsComponent },

  { path: '**', redirectTo: '/' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
