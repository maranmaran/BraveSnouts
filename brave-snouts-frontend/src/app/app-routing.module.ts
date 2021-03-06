import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppContainerComponent } from 'src/app/core/app-container/app-container.component';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
import { HandoverConfirmComponent } from 'src/app/features/auction-feature/delivery/handover-confirm/handover-confirm.component';
import { PostConfirmComponent } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';
import { SingleItemComponent } from 'src/app/features/auction-feature/item/single-item/single-item.component';
import { AdminPageComponent } from 'src/app/features/auction-feature/user/admin-page/admin-page.component';
import { UserItemsComponent } from 'src/app/features/auction-feature/user/user-auctions/user-items.component';
import { EmailLoginComponent } from 'src/app/features/auth-feature/email-login/email-login.component';
import { EmailOptoutComponent } from 'src/app/features/auth-feature/email-optout/email-optout.component';
import { AuctionRulesComponent } from 'src/app/shared/auction-rules/auction-rules.component';
import { PrivacyPolicyComponent } from 'src/app/shared/privacy-policy/privacy-policy.component';
import { AdminGuard } from 'src/business/guards/admin.guard';
import { AuctionActiveGuard } from 'src/business/guards/auction-active.guard';
import { AuctionFormGuard } from 'src/business/guards/auction-form.guard';
import { AuctionIdGuard } from 'src/business/guards/auction-id.guard';
import { AuthGuard } from 'src/business/guards/auth.guard';
import { AuctionBulkImageFormComponent } from './features/auction-feature/auction/auction-bulk-image-form/auction-bulk-image-form.component';
import { AdminAuctionsPageComponent } from './features/auction-feature/user/admin-auctions-page/admin-auctions-page.component';

const routes: Routes = [
  // root
  // { path: '', component: MaintenanceComponent},
  { path: '', redirectTo: 'app', pathMatch: 'full' },

  { path: 'app', component: AppContainerComponent, children: [

    { path: '', redirectTo: 'auctions', pathMatch: 'full'},

    { path: 'auctions', component: AuctionListComponent },

    { path: 'post-confirm', component: PostConfirmComponent },
    { path: 'handover-confirm', component: HandoverConfirmComponent },

    { path: 'create-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },
    { path: 'create-auction-bulk-image-upload', component: AuctionBulkImageFormComponent },
    { path: 'edit-auction', canActivate: [AuthGuard, AuctionFormGuard], component: AuctionFormComponent },

    { path: 'auction',  canActivate: [AuctionIdGuard, AuctionActiveGuard], component: AuctionDetailsComponent },
    { path: 'item', canActivate: [AuctionActiveGuard], component: SingleItemComponent },

    { path: 'my-items', canActivate: [AuthGuard], component: UserItemsComponent },
    { path: 'admin-page', canActivate: [AdminGuard, AuctionIdGuard], component: AdminPageComponent },
    { path: 'admin-auctions-page', canActivate: [AdminGuard], component: AdminAuctionsPageComponent },

    { path: 'email-login', component: EmailLoginComponent },
    { path: 'email-optout', component: EmailOptoutComponent },

    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'rules', component: AuctionRulesComponent },

  ]},

  // non matched routes
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
