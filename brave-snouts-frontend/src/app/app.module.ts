import {  NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GalleryModule, GALLERY_CONFIG } from 'ng-gallery';
import { LightboxModule, LIGHTBOX_CONFIG } from 'ng-gallery/lightbox';
import { CountdownModule } from 'ngx-countdown';
import { DragScrollModule } from 'ngx-drag-scroll';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { QuillModule } from 'ngx-quill';
import { AuctionDetailsComponent } from 'src/app/features/auction-feature/auction/auction-details/auction-details.component';
import { AuctionFormComponent } from 'src/app/features/auction-feature/auction/auction-form/auction-form.component';
import { AuctionListComponent } from 'src/app/features/auction-feature/auction/auction-list/auction-list.component';
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
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ItemMediaComponent } from './features/auction-feature/item/item-media/item-media.component';
import { AuctionBidsComponent } from './features/auction-feature/auction/auction-bids/auction-bids.component';
import { AngularFireFunctionsModule, REGION, USE_EMULATOR } from '@angular/fire/functions';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    // Core stuff
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,

    // Auction 
    NgxDropzoneModule,
    GalleryModule,
    LightboxModule,
    CountdownModule,
    DragScrollModule,
    
    // Shared
    MaterialModule,
    ReactiveFormsModule,
    QuillModule.forRoot({modules})
  ],
  declarations: [
    AppComponent,
    
    // Auction feature
    AuctionListComponent,
    AuctionDetailsComponent,
    AuctionFormComponent,
    ItemListComponent,
    ItemDetailsComponent,
    ItemMediaComponent,
    DonateComponent,
    
    // shared
    TruncatedTextComponent,
    TruncatePipe,
    ConfirmDialogComponent,

    // auth
    LoginMethodComponent,

    // Core
    ToolbarComponent,

    AuctionBidsComponent,
  ],
  providers: [
    { provide: REGION, useValue: 'europe-west1' },
    { provide: USE_EMULATOR, useValue: ['localhost', 5001] },
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
