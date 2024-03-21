import { ClipboardModule } from "@angular/cdk/clipboard";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { provideHotToastConfig } from "@ngxpert/hot-toast";
import { GalleryModule } from "ng-gallery";
import { LightboxModule } from "ng-gallery/lightbox";
import { CountdownModule } from "ngx-countdown";
import { DragScrollComponent, DragScrollItemDirective } from "ngx-drag-scroll";
import { NgxDropzoneModule } from "ngx-dropzone";
import { AuctionsToolbarComponent } from "src/app/features/auction-feature/auctions-toolbar/auctions-toolbar.component";
import { ConfirmDialogComponent } from "src/app/shared/confirm-dialog/confirm-dialog.component";
import { MaintenanceComponent } from "src/app/shared/maintenance/maintenance.component";
import { MaterialModule } from "src/app/shared/material.module";
import { MessageDialogComponent } from "src/app/shared/message-dialog/message-dialog.component";
import { EmailCopyComponent } from "src/app/shared/support/email-copy.component";
import { SupportComponent } from "src/app/shared/support/support.component";
import { TruncatedTextComponent } from "src/app/shared/truncated-text/truncated-text.component";
import { VirtualScrollerModule } from "src/app/shared/virtual-scroll/virtual-scroll.module";
import { AuctionDatePipe } from "src/business/pipes/custom-date.pipe";
import { FirebaseImagePipe } from "src/business/pipes/firebase-image.pipe";
import { MoneyPipe } from "src/business/pipes/money.pipe";
import { TruncatePipe } from "src/business/pipes/truncate.pipe";
import { ChangeEmailDialogComponent } from "../auth-feature/change-email-dialog/change-email-dialog.component";
import { EmailLoginComponent } from "../auth-feature/email-login/email-login.component";
import { EmailOptoutComponent } from "../auth-feature/email-optout/email-optout.component";
import { LoginMethodComponent } from "../auth-feature/login-method/login-method.component";
import { RegisterComponent } from "../auth-feature/register/register.component";
import { AuctionBulkImageFormComponent } from "./auction/auction-bulk-image-form/auction-bulk-image-form.component";
import { AuctionDetailsComponent } from "./auction/auction-details/auction-details.component";
import { AuctionFormComponent } from "./auction/auction-form/auction-form.component";
import { AuctionListComponent } from "./auction/auction-list/auction-list.component";
import { AuctionsHomeComponent } from "./auctions-home.component";
import { AuctionsRoutingModule } from "./auctions-routing.module";
import { HandoverConfirmComponent } from "./delivery/handover-confirm/handover-confirm.component";
import { HandoverDialogComponent } from "./delivery/handover-dialog/handover-dialog.component";
import { PostConfirmComponent } from "./delivery/post-confirm/post-confirm.component";
import { PostDetailsComponent } from "./delivery/post-details/post-details.component";
import { AuctionRulesComponent } from "./information/auction-rules/auction-rules.component";
import { DonateComponent } from "./information/donate/donate.component";
import { PrivacyPolicyComponent } from "./information/privacy-policy/privacy-policy.component";
import { ItemDetailsComponent } from "./item/item-details/item-details.component";
import { ItemGalleryComponent } from "./item/item-gallery/item-gallery.component";
import { ItemListComponent } from "./item/item-list/item-list.component";
import { ItemMediaComponent } from "./item/item-media/item-media.component";
import { ItemsListDialogComponent } from "./item/items-list-dialog/items-list-dialog.component";
import { SingleItemDialogComponent } from "./item/single-item-dialog/single-item-dialog.component";
import { SingleItemComponent } from "./item/single-item/single-item.component";
import { AdminAuctionsPageComponent } from "./user/admin-auctions-page/admin-auctions-page.component";
import { AdminPageComponent } from "./user/admin-page/admin-page.component";
import { UserItemsComponent } from "./user/user-auctions/user-items.component";
import { WinnerDetailsDialogComponent } from "./user/winner-details-dialog/winner-details-dialog.component";

@NgModule({
    imports: [
        CommonModule,
        AuctionsRoutingModule,

        // Auction
        NgxDropzoneModule,
        GalleryModule,
        LightboxModule,
        CountdownModule,

        DragScrollComponent,
        DragScrollItemDirective,

        // Shared
        MaterialModule,
        ClipboardModule,
        ReactiveFormsModule,
        NgOptimizedImage,

        // Custom shared
        VirtualScrollerModule,

        // Shared
        AuctionsToolbarComponent,
        MaintenanceComponent,
        SupportComponent,
        TruncatedTextComponent,
        TruncatePipe,
        ConfirmDialogComponent,
        MessageDialogComponent,
        EmailCopyComponent,
        MessageDialogComponent,
    ],

    declarations: [
        // Core
        AuctionsHomeComponent,

        // Misc
        DonateComponent,
        PrivacyPolicyComponent,
        AuctionRulesComponent,

        // Auctions
        AuctionListComponent,
        AuctionDetailsComponent,
        AuctionFormComponent,
        AuctionDatePipe,

        ItemListComponent,
        ItemDetailsComponent,
        ItemMediaComponent,

        ItemsListDialogComponent,
        ItemGalleryComponent,

        PostConfirmComponent,
        PostDetailsComponent,

        HandoverConfirmComponent,
        HandoverDialogComponent,

        UserItemsComponent,

        SingleItemComponent,
        SingleItemDialogComponent,

        // Auth
        LoginMethodComponent,
        EmailLoginComponent,
        ChangeEmailDialogComponent,
        RegisterComponent,
        EmailOptoutComponent,

        // Admin 
        AdminPageComponent,
        AuctionBulkImageFormComponent,
        AdminAuctionsPageComponent,
        WinnerDetailsDialogComponent,

        // Shared
        MoneyPipe,
        FirebaseImagePipe,
    ],
    providers: [
        FirebaseImagePipe,
        provideHotToastConfig()
    ]
})
export class AuctionsModule { }
