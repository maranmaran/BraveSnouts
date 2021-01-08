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

const routes: Routes = [
  { path: '', component: AuctionListComponent},
  { path: 'create-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },
  { path: 'edit-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },  
  // For /auction path
  // TODO Auction active guard
  // TODO Has Auction Id guard
  { path: 'auction',  component: AuctionDetailsComponent }, 
  // For /bids path
  // TODO Has Auction Id guard
  { path: 'bids', canActivate: [AdminGuard], component: AuctionBidsComponent },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
