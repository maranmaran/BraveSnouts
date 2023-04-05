import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { environment } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/material.module';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,

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
})
export class AppModule { }
