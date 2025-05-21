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
import { getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { ErrorInterceptor } from 'src/business/interceptors/error.interceptor';
import { HttpInterceptor } from 'src/business/interceptors/http.interceptor';
import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/material.module';
// import { USE_EMULATOR as AUTH_EMULATOR } from '@angular/fire/auth';
// import { USE_EMULATOR as FIRESTORE_EMULATOR } from '@angular/fire/firestore';
// import { USE_EMULATOR as FUNCTIONS_EMULATOR } from '@angular/fire/functions';

registerLocaleData(hrLocale);

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
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: FIRESTORE_SETTINGS, useValue: { ignoreUndefinedProperties: true } },
    // { provide: AUTH_EMULATOR, useValue: environment.production ? undefined : ['localhost', 9099], },
    // { provide: FIRESTORE_EMULATOR, useValue: environment.production ? undefined : ['localhost', 8080],},
    // { provide: FUNCTIONS_EMULATOR, useValue: environment.production ? undefined : ['localhost', 5001], },
  ]
})
export class AppModule {
  constructor() {
    this.initializeAppCheck();
  }

  initializeAppCheck() {
    setTimeout(() => {
      const firebaseApp = getApp(); // get app that has been initialized with Angularfire above
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(environment.firebaseConfig.appCheckKey),
        isTokenAutoRefreshEnabled: true
      });
    })
  }
}
