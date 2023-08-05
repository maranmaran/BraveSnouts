import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { AdminGuard } from 'src/business/guards/admin.guard';
import { AuctionActiveGuard } from 'src/business/guards/auction-active.guard';
import { AuctionFormGuard } from 'src/business/guards/auction-form.guard';
import { AuctionIdGuard } from 'src/business/guards/auction-id.guard';
import { AuthGuard } from 'src/business/guards/auth.guard';
import { AuctionBulkImageFormComponent } from './auction/auction-bulk-image-form/auction-bulk-image-form.component';
import { AuctionsHomeComponent } from './auctions-home.component';
import { AuctionRulesComponent } from './information/auction-rules/auction-rules.component';
import { PrivacyPolicyComponent } from './information/privacy-policy/privacy-policy.component';
import { AdminAuctionsPageComponent } from './user/admin-auctions-page/admin-auctions-page.component';

const routes: Routes = [
    {
        path: '', component: AuctionsHomeComponent, children: [
            { path: '', component: AuctionListComponent },

            { path: 'potvrda-posta', component: PostConfirmComponent },
            { path: 'potvrda-primopredaja', component: HandoverConfirmComponent },

            { path: 'kreiranje-aukcije', canActivate: [AdminGuard, AuctionFormGuard], component: AuctionFormComponent },
            { path: 'izmjena-aukcije', canActivate: [AdminGuard, AuctionFormGuard], component: AuctionFormComponent },
            { path: 'kreiranje-aukcije-sa-ucitavanjem-slika', canActivate: [AdminGuard], component: AuctionBulkImageFormComponent },

            { path: 'aukcija', canActivate: [AuctionIdGuard, AuctionActiveGuard], component: AuctionDetailsComponent },
            { path: 'predmet', canActivate: [AuctionActiveGuard], component: SingleItemComponent },

            { path: 'moji-predmeti', canActivate: [AuthGuard], component: UserItemsComponent },
            { path: 'aukcija-administracija', canActivate: [AdminGuard, AuctionIdGuard], component: AdminPageComponent },
            { path: 'administracija', canActivate: [AdminGuard], component: AdminAuctionsPageComponent },

            { path: 'email-prijava', component: EmailLoginComponent },
            { path: 'email-postavke', component: EmailOptoutComponent },

            { path: 'polica-privatnosti', component: PrivacyPolicyComponent },
            { path: 'pravila', component: AuctionRulesComponent },
        ]
    },
    // non matched routes
    { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuctionsRoutingModule { }
