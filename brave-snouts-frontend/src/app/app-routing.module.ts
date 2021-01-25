import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuctionBidsComponent } from 'src/app/features/auction-feature/auction/auction-bids/auction-bids.component';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
import { HandoverConfirmComponent } from 'src/app/features/auction-feature/delivery/handover-confirm/handover-confirm.component';
import { PostConfirmComponent } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';
import { UserItemsComponent } from 'src/app/features/auction-feature/user/user-auctions/user-items.component';
import { AdminGuard } from 'src/business/guards/admin.guard';
import { AuctionActiveGuard } from 'src/business/guards/auction-active.guard';
import { AuctionFormGuard } from 'src/business/guards/auction-form.guard';
import { AuctionIdGuard } from 'src/business/guards/auction-id.guard';
import { AuthGuard } from 'src/business/guards/auth.guard';

const routes: Routes = [
  // root
  { path: '', component: AuctionListComponent},

  // user confirmations for delivery
  { path: 'post-confirm', component: PostConfirmComponent },
  { path: 'handover-confirm', component: HandoverConfirmComponent },

  // forms
  { path: 'create-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },
  { path: 'edit-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },  

  // auction details for bidding
  { path: 'auction',  canActivate: [AuctionIdGuard, AuctionActiveGuard], component: AuctionDetailsComponent }, 
  
  // user page for auction tracking
  { path: 'my-items', canActivate: [AuthGuard], component: UserItemsComponent }, 

  // admin page
  { path: 'bids', canActivate: [AdminGuard, AuctionIdGuard], component: AuctionBidsComponent },

  // non matched routes
  { path: '**', redirectTo: '/' } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
