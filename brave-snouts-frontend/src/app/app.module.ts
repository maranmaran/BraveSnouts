import { ClipboardModule } from '@angular/cdk/clipboard';
import { registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import hrLocale from '@angular/common/locales/hr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule, SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/compat/firestore';
import { AngularFireFunctionsModule, REGION } from '@angular/fire/compat/functions';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HotToastModule } from '@ngneat/hot-toast';
import { GalleryModule, GALLERY_CONFIG } from 'ng-gallery';
import { LightboxModule, LIGHTBOX_CONFIG } from 'ng-gallery/lightbox';
import { CountdownModule } from 'ngx-countdown';
import { DragScrollModule } from 'ngx-drag-scroll';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
import { HandoverConfirmComponent } from 'src/app/features/auction-feature/delivery/handover-confirm/handover-confirm.component';
import { PostConfirmComponent } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';
import { ItemDetailsComponent } from 'src/app/features/auction-feature/item/item-details/item-details.component';
import { ItemListComponent } from 'src/app/features/auction-feature/item/item-list/item-list.component';
import { ItemsListDialogComponent } from 'src/app/features/auction-feature/item/items-list-dialog/items-list-dialog.component';
import { UserItemsComponent } from 'src/app/features/auction-feature/user/user-auctions/user-items.component';
import { LoginMethodComponent } from 'src/app/features/auth-feature/login-method/login-method.component';
import { AuctionRulesComponent } from 'src/app/shared/auction-rules/auction-rules.component';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { DonateComponent } from 'src/app/shared/donate/donate.component';
import { MaintenanceComponent } from 'src/app/shared/maintenance/maintenance.component';
import { MaterialModule } from 'src/app/shared/material.module';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { PrivacyPolicyComponent } from 'src/app/shared/privacy-policy/privacy-policy.component';
import { SupportComponent } from 'src/app/shared/support/support.component';
import { ToolbarComponent } from 'src/app/shared/toolbar/toolbar.component';
import { TruncatedTextComponent } from 'src/app/shared/truncated-text/truncated-text.component';
import { ErrorInterceptor } from 'src/business/interceptors/error.interceptor';
import { HttpInterceptor } from 'src/business/interceptors/http.interceptor';
import { modules } from 'src/business/models/editor.config';
import { AuctionDatePipe } from 'src/business/pipes/custom-date.pipe';
import { MoneyPipe } from 'src/business/pipes/money.pipe';
import { TruncatePipe } from 'src/business/pipes/truncate.pipe';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppContainerComponent } from './core/app-container/app-container.component';
import { AuctionBulkImageFormComponent } from './features/auction-feature/auction/auction-bulk-image-form/auction-bulk-image-form.component';
import { HandoverDialogComponent } from './features/auction-feature/delivery/handover-dialog/handover-dialog.component';
import { PostDetailsComponent } from './features/auction-feature/delivery/post-details/post-details.component';
import { ItemGalleryComponent } from './features/auction-feature/item/item-gallery/item-gallery.component';
import { ItemMediaComponent } from './features/auction-feature/item/item-media/item-media.component';
import { SingleItemDialogComponent } from './features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { SingleItemComponent } from './features/auction-feature/item/single-item/single-item.component';
import { AdminAuctionsPageComponent } from './features/auction-feature/user/admin-auctions-page/admin-auctions-page.component';
import { AdminPageComponent } from './features/auction-feature/user/admin-page/admin-page.component';
import { WinnerDetailsDialogComponent } from './features/auction-feature/user/winner-details-dialog/winner-details-dialog.component';
import { ChangeEmailDialogComponent } from './features/auth-feature/change-email-dialog/change-email-dialog.component';
import { EmailLoginComponent } from './features/auth-feature/email-login/email-login.component';
import { EmailOptoutComponent } from './features/auth-feature/email-optout/email-optout.component';
import { RegisterComponent } from './features/auth-feature/register/register.component';
import { EmailCopyComponent } from './shared/support/email-copy.component';
import { VirtualScrollerModule } from './shared/virtual-scroll/virtual-scroll.module';

registerLocaleData(hrLocale);

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    // Firebase
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,

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
    FormsModule,
    ReactiveFormsModule,

    // Custom shared
    VirtualScrollerModule,
    FlexLayoutModule,
    HotToastModule.forRoot(),
  ],

  declarations: [
    // Core
    AppComponent,
    AppContainerComponent,
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
        dots: false,
        counter: false,
        imageSize: 'contain',
        thumb: false,
        loop: false,
      },
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
