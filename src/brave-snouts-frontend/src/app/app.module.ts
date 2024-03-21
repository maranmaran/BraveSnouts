import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule, NgOptimizedImage, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import hrLocale from '@angular/common/locales/hr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule, SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/compat/firestore';
import { AngularFireFunctionsModule, REGION } from '@angular/fire/compat/functions';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GALLERY_CONFIG } from 'ng-gallery';
import { LIGHTBOX_CONFIG } from 'ng-gallery/lightbox';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { ErrorInterceptor } from 'src/business/interceptors/error.interceptor';
import { HttpInterceptor } from 'src/business/interceptors/http.interceptor';
import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/material.module';

registerLocaleData(hrLocale);

export const DEFAULT_GALLERY_CONFIG = {
  imageSize: 'contain',
  scrollBehavior: 'smooth',
  loadingStrategy: 'preload',

  itemAutosize: false,
  autoHeight: false,

  dots: false,
  counter: false,
  thumb: false,
  loop: true,

  debug: false,
}

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,

    // Google analytics
    // NgxGoogleAnalyticsModule.forRoot(environment.firebaseConfig.measurementId),
    // NgxGoogleAnalyticsRouterModule,

    // Firebase
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,

    // Shared
    MaterialModule,
    ClipboardModule,
    ReactiveFormsModule,
    NgOptimizedImage,
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [
    { provide: LOCALE_ID, useValue: 'hr' },
    { provide: REGION, useValue: 'europe-west1' },
    { provide: LIGHTBOX_CONFIG, useValue: { imageSize: 'contain' } },
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: FIRESTORE_SETTINGS, useValue: { ignoreUndefinedProperties: true } },
    // {
    //   provide: FUNCTIONS_EMULATOR,
    //   useValue: true ? undefined : (console.warn('EMULATOR DEFINED', FUNCTIONS_EMULATOR), ['localhost', 5001]),
    // },
    {
      provide: GALLERY_CONFIG, useValue: {
        autoPlay: true,
        imageSize: 'cover',
        dots: true,
        dotsPosition: 'bottom',

        scrollBehavior: 'smooth',
        loadingStrategy: 'preload',

        counter: false,
        thumb: false,
        loop: true,

        debug: false,
      }
    },
  ]
})
export class AppModule { }
