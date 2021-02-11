import { LOCALE_ID, NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireFunctionsModule, REGION } from '@angular/fire/functions';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GalleryModule, GALLERY_CONFIG } from 'ng-gallery';
import { LightboxModule, LIGHTBOX_CONFIG } from 'ng-gallery/lightbox';
import { CountdownModule } from 'ngx-countdown';
import { DragScrollModule } from 'ngx-drag-scroll';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgxMaterialTimepickerModule} from 'ngx-material-timepicker';
import { QuillModule } from 'ngx-quill';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
import { HandoverConfirmComponent } from 'src/app/features/auction-feature/delivery/handover-confirm/handover-confirm.component';
import { PostConfirmComponent } from 'src/app/features/auction-feature/delivery/post-confirm/post-confirm.component';
import { ItemDetailsComponent } from 'src/app/features/auction-feature/item/item-details/item-details.component';
import { ItemListComponent } from 'src/app/features/auction-feature/item/item-list/item-list.component';
import { LoginMethodComponent } from 'src/app/features/auth-feature/login-method/login-method.component';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { DonateComponent } from 'src/app/shared/donate/donate.component';
import { MaterialModule } from 'src/app/shared/material.module';
import { ToolbarComponent } from 'src/app/shared/toolbar/toolbar.component';
import { TruncatedTextComponent } from 'src/app/shared/truncated-text/truncated-text.component';
import { modules } from 'src/business/models/editor.config';
import { TruncatePipe } from 'src/business/pipes/truncate.pipe';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ItemMediaComponent } from './features/auction-feature/item/item-media/item-media.component';
import { PostDetailsComponent } from './features/auction-feature/delivery/post-details/post-details.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { UserItemsComponent } from 'src/app/features/auction-feature/user/user-auctions/user-items.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorInterceptor } from 'src/business/interceptors/error.interceptor';
import { HttpInterceptor } from 'src/business/interceptors/http.interceptor';
import { AdminPageComponent } from './features/auction-feature/user/admin-page/admin-page.component';
import { HandoverDialogComponent } from './features/auction-feature/delivery/handover-dialog/handover-dialog.component';
import { SingleItemComponent } from './features/auction-feature/item/single-item/single-item.component';
import { ItemGalleryComponent } from './features/auction-feature/item/item-gallery/item-gallery.component';
import { EmailLoginComponent } from './features/auth-feature/email-login/email-login.component';
import { EmailOptoutComponent } from './features/auth-feature/email-optout/email-optout.component';
import { HotToastModule } from '@ngneat/hot-toast';
import { SingleItemDialogComponent } from './features/auction-feature/item/single-item-dialog/single-item-dialog.component';
import { AppContainerComponent } from './core/app-container/app-container.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { AuctionRulesComponent } from 'src/app/shared/auction-rules/auction-rules.component';
import { MaintenanceComponent } from 'src/app/shared/maintenance/maintenance.component';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { PrivacyPolicyComponent } from 'src/app/shared/privacy-policy/privacy-policy.component';
import hrLocale from '@angular/common/locales/hr';
import { registerLocaleData } from '@angular/common';
import { AuctionDatePipe } from 'src/business/pipes/custom-date.pipe';
import { environment } from 'src/environments/environment';
import { ItemsListDialogComponent } from 'src/app/features/auction-feature/item/items-list-dialog/items-list-dialog.component';

registerLocaleData(hrLocale);

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    // Core stuff
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule.enablePersistence(),
    AngularFireStorageModule,
    AngularFireFunctionsModule,

    // Auction 
    NgxMaterialTimepickerModule,
    NgxDropzoneModule,
    GalleryModule,
    LightboxModule,
    CountdownModule,
    DragScrollModule,
    QuillModule.forRoot({modules}),
    
    // Shared
    MaterialModule,
    ReactiveFormsModule,
    VirtualScrollerModule,
    HotToastModule.forRoot(),

  ],
  declarations: [

    // core
    AppComponent,
    ToolbarComponent,
    
    // Auction feature
    AuctionListComponent,
    AuctionDetailsComponent,
    AuctionFormComponent,
    ItemListComponent,
    ItemDetailsComponent,
    ItemMediaComponent,
    PostConfirmComponent,
    HandoverConfirmComponent,
    PostDetailsComponent,
    UserItemsComponent,
    
    // other
    DonateComponent,

    // shared
    TruncatedTextComponent,
    TruncatePipe,
    AuctionDatePipe,
    ConfirmDialogComponent,

    // auth
    LoginMethodComponent,

    AdminPageComponent,

    HandoverDialogComponent,

    SingleItemComponent,
    SingleItemDialogComponent,

    ItemGalleryComponent,

    EmailLoginComponent,
    EmailOptoutComponent,
    AppContainerComponent,

    PrivacyPolicyComponent, 
    MessageDialogComponent, 
    MaintenanceComponent, 
    AuctionRulesComponent, 
    FooterComponent, 
    ItemsListDialogComponent
  ],
  providers: [
    { provide: LOCALE_ID, useValue: "hr" }, 
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: REGION, useValue: 'europe-west1' },
    // { provide: USE_EMULATOR, useValue: ['localhost', 5001] },
    {
      provide: GALLERY_CONFIG,
      useValue: {
        dots: false,
        counter: false,
        imageSize: 'cover',
        thumb: false,
        loop: false,
      }
    },
    {
      provide: LIGHTBOX_CONFIG,
      useValue: {
        imageSize: 'contain',
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
