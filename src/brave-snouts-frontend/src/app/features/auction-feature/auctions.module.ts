import { ClipboardModule } from "@angular/cdk/clipboard";
import { CommonModule, NgOptimizedImage, registerLocaleData } from "@angular/common";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import hrLocale from '@angular/common/locales/hr';
import { LOCALE_ID, NgModule } from "@angular/core";
import { SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/compat/firestore';
import { REGION } from "@angular/fire/compat/functions";
import { ReactiveFormsModule } from "@angular/forms";
import { HotToastModule } from "@ngneat/hot-toast";
import { GalleryModule, GALLERY_CONFIG } from "ng-gallery";
import { LightboxModule, LIGHTBOX_CONFIG } from "ng-gallery/lightbox";
import { CountdownModule } from "ngx-countdown";
import { DragScrollModule } from "ngx-drag-scroll";
import { NgxDropzoneModule } from "ngx-dropzone";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from "ngx-google-analytics";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { QuillModule } from "ngx-quill";
import { AuctionRulesComponent } from "src/app/shared/auction-rules/auction-rules.component";
import { ConfirmDialogComponent } from "src/app/shared/confirm-dialog/confirm-dialog.component";
import { DonateComponent } from "src/app/shared/donate/donate.component";
import { MaintenanceComponent } from "src/app/shared/maintenance/maintenance.component";
import { MaterialModule } from "src/app/shared/material.module";
import { MessageDialogComponent } from "src/app/shared/message-dialog/message-dialog.component";
import { PrivacyPolicyComponent } from "src/app/shared/privacy-policy/privacy-policy.component";
import { EmailCopyComponent } from "src/app/shared/support/email-copy.component";
import { SupportComponent } from "src/app/shared/support/support.component";
import { ToolbarComponent } from "src/app/shared/toolbar/toolbar.component";
import { TruncatedTextComponent } from "src/app/shared/truncated-text/truncated-text.component";
import { VirtualScrollerModule } from "src/app/shared/virtual-scroll/virtual-scroll.module";
import { ErrorInterceptor } from "src/business/interceptors/error.interceptor";
import { HttpInterceptor } from "src/business/interceptors/http.interceptor";
import { modules } from "src/business/models/editor.config";
import { AuctionDatePipe } from "src/business/pipes/custom-date.pipe";
import { MoneyPipe } from "src/business/pipes/money.pipe";
import { TruncatePipe } from "src/business/pipes/truncate.pipe";
import { environment } from "src/environments/environment";
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

registerLocaleData(hrLocale);

@NgModule({
    imports: [
        CommonModule,
        AuctionsRoutingModule,

        // Google analytics
        NgxGoogleAnalyticsModule.forRoot(environment.firebaseConfig.measurementId),
        NgxGoogleAnalyticsRouterModule,

        // Auction
        NgxMaterialTimepickerModule,
        NgxDropzoneModule,
        GalleryModule,
        LightboxModule,
        CountdownModule,
        DragScrollModule,
        QuillModule.forRoot({ modules }),

        // Shared
        MaterialModule,
        ClipboardModule,
        ReactiveFormsModule,
        NgOptimizedImage,

        // Custom shared
        VirtualScrollerModule,
        FlexLayoutModule,
        HotToastModule.forRoot(),
    ],

    declarations: [
        // Core
        AuctionsHomeComponent,
        ToolbarComponent,

        // Misc
        DonateComponent,
        PrivacyPolicyComponent,
        MaintenanceComponent,
        SupportComponent,
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
        TruncatedTextComponent,
        TruncatePipe,
        MoneyPipe,
        ConfirmDialogComponent,
        MessageDialogComponent,
        EmailCopyComponent,
        MessageDialogComponent,
    ],
    providers: [
        { provide: LOCALE_ID, useValue: 'hr' },
        { provide: REGION, useValue: 'europe-west1' },
        { provide: LIGHTBOX_CONFIG, useValue: { imageSize: 'contain' } },
        { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: FIRESTORE_SETTINGS, useValue: { ignoreUndefinedProperties: true } },
        {
            provide: GALLERY_CONFIG,
            useValue: {
                imageSize: 'contain',
                scrollBehavior: 'smooth',
                loadingStrategy: 'preload',

                itemAutosize: false,
                autoHeight: false,

                dots: false,
                counter: false,
                thumb: false,
                loop: false,

                debug: false,
            },
        },
    ]
})
export class AuctionsModule { }
