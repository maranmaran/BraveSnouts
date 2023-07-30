import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { HotToastService } from '@ngneat/hot-toast';
import 'firebase/auth';
import firebase from 'firebase/compat/app';
import { firstValueFrom, from, noop, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  first,
  map,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs/operators';
import { ChangeEmailDialogComponent } from 'src/app/features/auth-feature/change-email-dialog/change-email-dialog.component';
import { LoginMethodComponent } from 'src/app/features/auth-feature/login-method/login-method.component';
import { MessageDialogComponent } from 'src/app/shared/message-dialog/message-dialog.component';
import { User } from 'src/business/models/user.model';
import { environment } from 'src/environments/environment';
import { RegisterComponent } from './../../app/features/auth-feature/register/register.component';

export type UserWithCode = User & { code: string };

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly store: AngularFirestore,
    private readonly dialog: MatDialog,
    private toastSvc: HotToastService
  ) { }

  user$ = this.auth.user.pipe(shareReplay(1));
  userId$ = this.auth.user.pipe(map((user) => user?.uid), shareReplay(1));
  isAuthenticated$ = this.user$.pipe(map((user) => !!user?.uid), shareReplay(1));

  userDbInfo$ = this.userId$.pipe(
    switchMap((id) => this.getUserDbExists(id).pipe(map((r) => [r, id]))),
    switchMap(([exists, id]) => {
      if (!id) {
        return of(null);
      }

      return exists
        ? this.getUser(id as string)
        : of(<Partial<User>>{ code: 'registration-not-complete' });
    }),
    first(),
    shareReplay(1)
  );

  isAdmin$ = from(this.auth.user).pipe(
    switchMap((user) =>
      user
        ? this.store.doc(`admins/${user.uid}`).valueChanges().pipe(take(1))
        : of(null)
    ),
    map(admin => !!admin),
    shareReplay(1)
  );

  login() {
    return from(this.auth.currentUser).pipe(
      concatMap((user) => {
        if (user) return of(user);

        let dialogRef = this.dialog.open(LoginMethodComponent, {
          height: 'auto',
          width: '98%',
          maxWidth: '20rem',
          autoFocus: false,
          closeOnNavigation: true,
        });

        // inner observable that resolves auth
        return dialogRef.afterClosed().pipe(
          first(),
          switchMap(login => login
            ? from(this.loginUser(login.method, login.data))
            : of(null)
          )
        );
      })
    );
  }

  /** This refers to users collection in firebase */
  getUserInformation() {
    return this.user$.pipe(
      switchMap((user) =>
        this.store
          .doc<User>(`users/${user.uid}`)
          .valueChanges({ idField: 'id' })
          .pipe(take(1))
      )
    );
  }

  logout() {
    return this.auth.signOut();
  }

  /** Logs user in depending on method */
  private async loginUser(method, data) {
    try {
      switch (method) {
        case 'gmail':
          // throw new Error("Not implemented");
          await this.handleGmailLogin();
          break;
        case 'facebook':
          throw new Error('Not implemented');
          break;
        case 'email':
          await this.handleEmailLogin(data.email);
          break;
        default:
          break;
      }
    } catch (err) {
      if (err.code) this.handleErrors(err);
      return null;
    }
  }

  private async handleGmailLogin() {
    const google = new firebase.auth.GoogleAuthProvider();
    google.addScope('profile');
    google.addScope('email');

    google.setCustomParameters({ prompt: 'select_account' });

    await this.auth.signInWithRedirect(google);
  }

  private handleEmailLogin(
    email: string
  ): Promise<firebase.auth.UserCredential | void> {
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (bravesnoutsdev.firebaseapp.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: `${environment.baseUrl}/aukcije/email-prijava`, // TODO: Change to global route
      // url: 'https://bravesnoutsdev.firebaseapp.com/email-login',
      // This must be true.
      handleCodeInApp: true,
    };

    return this.auth
      .sendSignInLinkToEmail(email, actionCodeSettings)
      .then(() => {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email);
        this.toastSvc.success('Poslali smo vam e-poštu za potvrdu prijave', {
          duration: 10000,
          dismissible: true,
          autoClose: true,
          position: 'top-center',
        });
      })
      .catch((err) => {
        console.error(err);

        this.toastSvc.error(
          'Imali smo poteškoća sa prijavom. Molimo vas pokušajte ponovno ili nas kontaktirajte.',
          {
            duration: 10000,
            dismissible: true,
            autoClose: true,
            position: 'top-center',
          }
        );
      });
  }

  emailLoginInProgress = false;
  async completeEmailLogin() {
    this.emailLoginInProgress = true;

    const isEmailSignIn = await this.auth.isSignInWithEmailLink(window.location.href);
    if (!isEmailSignIn)
      return new Promise((_, err) => err('Not email sign in'));

    // Confirm the link is a sign-in with email link.
    // Additional state parameters can also be passed via URL.
    // This can be used to continue the user's intended action before triggering the sign-in operation.
    // Get the email if available. This should be available if the user completes
    // the flow on the same device where they started it.
    var email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // User opened the link on a different device. To prevent session fixation
      // attacks, ask the user to provide the associated email again. For example:
      email = window.prompt('Molim vas unesite email za potvrdu');
    }

    // The client SDK will parse the code from the link for you.
    return this.auth
      .signInWithEmailLink(email, window.location.href)
      .then(async cred => {
        // Clear email from storage.
        window.localStorage.removeItem('emailForSignIn');

        // You can access the new user via result.user
        // Additional user info profile not available via:
        // result.additionalUserInfo.profile == null
        // You can check if the user is new or existing:
        // result.additionalUserInfo.isNewUser

        const userRegistered = (
          await firstValueFrom(this.store.doc(`users/${cred.user.uid}`).get())
        ).exists;

        if (!cred.additionalUserInfo.isNewUser && userRegistered) return;

        return await firstValueFrom(
          this.registerUserComplete(cred.user.uid, cred.user.email, '', 'email', 'email')
        );
      })
      .catch(err => (
        console.error(err),
        this.toastSvc.error('Neispravan email ili iskorišten link za prijavu')
      ))
      .finally(() => (this.emailLoginInProgress = false));
  }

  registerUserComplete(
    id: string,
    email: string,
    photoURL: string,
    providerId: string,
    signInMethod: string
  ) {
    // GET USER DATA
    const dialogRef = this.dialog.open(RegisterComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '20rem',
      autoFocus: false,
      closeOnNavigation: false,
      disableClose: true,
      data: email,
    });

    // inner observable that resolves auth
    return dialogRef.afterClosed().pipe(
      first(),
      switchMap((data) => {
        const user = new User({
          id,
          displayName: data.name,
          email: data.email,
          avatar: photoURL,
          phoneNumber: data.phone,
          signInMethod,
          providerId,
        });

        return this.addNewUser(user);
      })
    );
  }

  /** Handles different login errors */
  private handleErrors(err, provider = null) {
    console.error(err);

    if (err?.code == 'no-email') {
      this.toastSvc.error(
        'Nije se moguće prijaviti nismo dobili email od pružatelja usluge.',
        {
          position: 'top-center',
          dismissible: true,
          autoClose: true,
        }
      );

      this.openChangeEmailDialog(
        'Nažalost nismo dobili e-mail od pružatelja usluge, molimo vas unesite e-mail.',
        false
      );
    }

    if (err?.code == 'auth/web-storage-unsupported') {
      this.toastSvc.error(
        'Keksići moraju biti uključeni, ako ste u incognito modu molim vas promjenite browser.',
        {
          position: 'top-center',
          dismissible: true,
          autoClose: true,
        }
      );
    }

    if (err?.code == 'auth/user-disabled') {
      this.toastSvc.error(
        'Račun vam je ukinut. Za više informacija možete se obratiti korisničkoj službi.',
        {
          position: 'top-center',
          dismissible: true,
          autoClose: true,
        }
      );
    }
  }

  /** Saves new user to the users collection */
  private addNewUser(user: User) {
    // save only when user is authenticated. Because of firestore rules
    return from(this.isAuthenticated$).pipe(
      filter((x) => !!x),
      take(1),
      switchMap(() => {
        // console.log("Saving", user)
        return this.store
          .collection(`users`)
          .doc(user.id)
          .set(Object.assign({}, user), { merge: true })
      })
    );
  }

  private getUser(id: string) {
    return this.store
      .doc(`users/${id}`)
      .valueChanges({ idField: 'id' }) as Observable<User>;
  }

  private getUserDbExists(id: string) {
    return this.store
      .doc(`users/${id}`)
      .get()
      .pipe(
        take(1),
        map((data) => data.exists)
      );
  }

  openChangeEmailDialog(message?: string, forcefulOverride = false) {
    const ref = this.dialog.open(ChangeEmailDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '23rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: 'dialog-no-padding',
      data: message,
    });

    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe((email) => {
        if (!email) return;

        this.changeEmail(email, forcefulOverride)
          .pipe(first())
          .subscribe(noop);
      });
  }

  private changeEmail(email: string, forcefulOverride = false) {
    return this.user$.pipe(
      first(),
      concatMap((user) => user.updateEmail(email)),
      catchError((err) => {
        if (err.code == 'auth/requires-recent-login') {
          this.logout().then(() =>
            this.toastSvc.warning(
              'Molimo vas prijavite se ponovno i ponovite promjenu e-maila.',
              {
                duration: 20000,
                dismissible: true,
              }
            )
          );

          return throwError(() => err);
        }

        this.toastSvc.error(
          'Došlo je do greške molimo vas obratite nam se na mail za pomoć'
        );
        return throwError(() => err);
      }),
      concatMap(() => this.userId$),
      concatMap(id =>
        this.store.doc(`users/${id}`).update({ email, overrideEmail: null })
      ),
      tap(() => {
        this.toastSvc.success('Uspješno izmjenjen e-mail');
      })
    );
  }

  // forceful user inform
  informUser(message: string) {
    let dialogRef = this.dialog.open(MessageDialogComponent, {
      height: 'auto',
      width: '98%',
      maxWidth: '30rem',
      autoFocus: false,
      closeOnNavigation: true,
      panelClass: ['item-dialog', 'mat-elevation-z8'],
      data: message,
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        concatMap(() => this.userId$)
      )
      .subscribe((id) => {
        this.store.doc(`users/${id}`).update({ informUser: null });
      });
  }
}
