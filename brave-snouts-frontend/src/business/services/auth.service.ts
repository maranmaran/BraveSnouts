import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material/dialog";
import { HotToastService } from "@ngneat/hot-toast";
import firebase from 'firebase/app';
import { from, noop, of, throwError } from "rxjs";
import { catchError, concatMap, filter, map, switchMap, take, tap } from "rxjs/operators";
import { ChangeEmailDialogComponent } from "src/app/features/auth-feature/change-email-dialog/change-email-dialog.component";
import { LoginMethodComponent } from "src/app/features/auth-feature/login-method/login-method.component";
import { User } from "src/business/models/user.model";
import { environment } from "src/environments/environment";


@Injectable({ providedIn: 'root' })
export class AuthService {

    private _usingRedirectFlag = true;

    constructor(
        private readonly auth: AngularFireAuth,
        private readonly store: AngularFirestore,
        private readonly dialog: MatDialog,
        private toastSvc: HotToastService,
    ) {
    }

    public get user$() {
        return this.auth.user;
    }

    public get userId$() {
        return this.auth.user.pipe(map(user => user?.uid));
    }

    public get userDbInfo$() {
      return this.userId$.pipe(
        switchMap(id => this.getUser(id).pipe(take(1)))
      );
    }

    public get isAuthenticated$() {
        return this.user$.pipe(map(user => !!user?.uid))
    }

    public get isAdmin$() {
        return from(this.auth.user)
            .pipe(
                switchMap(user => user ? this.store.doc(`admins/${user.uid}`).valueChanges().pipe(take(1)) : of(null)),
                // tap(console.log),
                map(admin => !!admin),
            );
    }

    login() {
        return from(this.auth.currentUser)
            .pipe(
                concatMap(user => {

                    if (user)
                        return of(user);

                    let dialogRef = this.dialog.open(LoginMethodComponent, {
                        height: 'auto',
                        width: '98%',
                        maxWidth: '20rem',
                        autoFocus: false,
                        closeOnNavigation: true
                    });

                    // inner observable that resolves auth
                    return dialogRef.afterClosed()
                        .pipe(
                            take(1),
                            switchMap(login => login ? from(this.doAuth(login.method, login.data)) : of(null))
                        )
                }),
                // concatMap(cred => cred ? this.getUserInternalInformation(cred.user.uid) : of(null))
            )
    }

    /** This refers to users collection in firebase */
    getUserInformation() {
        return this.user$.pipe(
            switchMap(user => this.store.doc<User>(`users/${user.uid}`)
                .valueChanges({ idField: 'id' })
                .pipe(take(1))
            )
        )
    }

    logout() {
      return this.auth.signOut();
    }

    /** Handles authentication flow
     * If user chose method then it logs him in
     * Registers user if he's new
     */
    async doAuth(method, data): Promise<firebase.auth.UserCredential> {

        const cred = await this.loginUser(method, data);

        if (this._usingRedirectFlag) {
            return;
        }

        if (cred && cred.additionalUserInfo.isNewUser) {
            await this.addNewUser(cred);
        }

        return cred;
    }

    /** Logs user in depending on method */
    async loginUser(method, data) {

        let cred: firebase.auth.UserCredential = null;

        try {

            switch (method) {
                case 'gmail':
                    cred = await this.handleGmailLogin();
                    break;
                case 'facebook':
                    cred = await this.handleFacebookLogin();
                    break;
                case 'email':
                    await this.handleEmailLogin(data.email);
                    break;
                default:
                    break;
            }

            if (cred == null && this._usingRedirectFlag) {
                return;
            }

            return cred;
        }
        catch (err) {
          this.handleErrors(err);
          return null;
        }
    }

    async handleGmailLogin() {
        const google = new firebase.auth.GoogleAuthProvider();
        google.addScope('profile');
        google.addScope('email');

        google.setCustomParameters({ prompt: 'select_account' })

        // return await this.auth.signInWithPopup(google);

        await this.auth.signInWithRedirect(google);
        return null;
    }

    async handleFacebookLogin(): Promise<firebase.auth.UserCredential> {
        const facebook = new firebase.auth.FacebookAuthProvider();
        facebook.addScope('email');
        // facebook.addScope('user_link');

        // return this.auth.signInWithPopup(facebook)
        // .then(cred => {
        //     console.log(cred);

        //     if(!cred?.user?.email || cred?.user?.email?.trim() == "") {
        //         throw { code: "no-email"};
        //     }

        //     return cred;
        // })

        await this.auth.signInWithRedirect(facebook);
        const cred = await this.auth.getRedirectResult()
            .then(cred => {
                // console.log(cred);

                if (!cred?.user?.email || cred?.user?.email?.trim() == "") {
                    throw { code: "no-email" };
                }

                return cred;
            })

        return null;
    }

    handleEmailLogin(email: string): Promise<firebase.auth.UserCredential | void> {

        const actionCodeSettings = {
            // URL you want to redirect back to. The domain (bravesnoutsdev.firebaseapp.com) for this
            // URL must be in the authorized domains list in the Firebase Console.
            url: `${environment.baseUrl}/email-login`,
            // url: 'https://bravesnoutsdev.firebaseapp.com/email-login',
            // This must be true.
            handleCodeInApp: true,
        };

        return this.auth.sendSignInLinkToEmail(email, actionCodeSettings).then(() => {
            // The link was successfully sent. Inform the user.
            // Save the email locally so you don't need to ask the user for it again
            // if they open the link on the same device.
            window.localStorage.setItem('emailForSignIn', email);
            this.toastSvc.success("Poslali smo vam e-poštu za potvrdu prijave", {
                duration: 10000,
                dismissible: true,
                autoClose: true,
                position: "top-center"
            })
        }).catch(err => {
            // console.log(err);
            this.toastSvc.error("Imali smo poteškoća sa prijavom. Molimo vas pokušajte ponovno ili nas kontaktirajte.", {
                duration: 10000,
                dismissible: true,
                autoClose: true,
                position: "top-center"
            })
        });
    }

    async completeSocialLogin() {

        if (!this._usingRedirectFlag) {
            return;
        }

        await this.auth.getRedirectResult()
            .then(cred => {
                // console.log(cred);

                if ((cred as any).code) {
                    this.handleErrors(cred);
                    return;
                }

                if (cred == null || cred.user == null || cred.additionalUserInfo?.profile == null) {
                    return;
                }

                const profile = cred.additionalUserInfo.profile as any;
                // console.log(profile);

                if (!profile.email || profile.email?.trim() == "") {
                    this.handleErrors({ code: "no-email" });
                    return;
                }

                if (cred && cred.additionalUserInfo.isNewUser) {
                    this.addNewUser(cred);
                }
            })
            .catch(err => {

                console.log(err);

                if (err.code == "auth/account-exists-with-different-credential") {
                    this.handleErrors({ code: err.code })
                }

                if (err.code) {
                    this.handleErrors(err);
                }
            })
    }

    async completeEmailLogin() {
        const isEmailSignIn = await this.auth.isSignInWithEmailLink(window.location.href);
        if (!isEmailSignIn) return new Promise((res, rej) => rej("Not email sign in"));

        // Confirm the link is a sign-in with email link.
        // Additional state parameters can also be passed via URL.
        // This can be used to continue the user's intended action before triggering
        // the sign-in operation.
        // Get the email if available. This should be available if the user completes
        // the flow on the same device where they started it.
        var email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            // User opened the link on a different device. To prevent session fixation
            // attacks, ask the user to provide the associated email again. For example:
            email = window.prompt('Molim vas unesite email za potvrdu');
        }
        // The client SDK will parse the code from the link for you.
        return this.auth.signInWithEmailLink(email, window.location.href)
            .then(async (cred) => {
                // Clear email from storage.

                // console.log(cred);

                window.localStorage.removeItem('emailForSignIn');

                // You can access the new user via result.user
                // Additional user info profile not available via:
                // result.additionalUserInfo.profile == null
                // You can check if the user is new or existing:
                // result.additionalUserInfo.isNewUser
                if (cred && cred.additionalUserInfo.isNewUser) {
                    const newCred = {
                        additionalUserInfo: {
                            providerId: "email"
                        },
                        credential: {
                            signInMethod: "email",
                            providerId: "email",
                        },
                        user: {
                            uid: cred.user.uid,
                            displayName: cred.user.email,
                            email: cred.user.email,
                            photoURL: cred.user.photoURL ?? ""
                        }
                    } as firebase.auth.UserCredential;

                    // console.log(newCred);
                    await this.addNewUser(newCred);
                }
            })
            .catch((err) => (console.log(err), window.alert("Neispravan email ili iskorišten link")));
    }

    /** Handles different login errors */
    handleErrors(err, provider = null) {
      console.error(err);

      // if (err?.code == "auth/account-exists-with-different-credential") {
      //     // this.store.collection("users").doc()
      //     this.toastSvc.error("Prijavite se na način na koji ste se prijavili prvi put u aplikaciju. Nije moguće imat račun sa dvije iste e-pošte.", {
      //         position: "top-center",
      //         dismissible: true,
      //         autoClose: true,
      //         duration: 20000
      //     });
      // }

      if (err?.code == "no-email") {
          this.toastSvc.error("Nije se moguće prijaviti nismo dobili email od pružatelja usluge.", {
              position: "top-center",
              dismissible: true,
              autoClose: true
          });

          this.openChangeEmailDialog("Nažalost nismo dobili e-mail od pružatelja usluge, molimo vas unesite e-mail.", false);
      }

      if (err?.code == "auth/web-storage-unsupported") {
          this.toastSvc.error("Keksići moraju biti uključeni, ako ste u incognito modu molim vas promjenite browser.", {
              position: "top-center",
              dismissible: true,
              autoClose: true
          });
      }
    }

    getNewUser(cred: firebase.auth.UserCredential) {

        const profile = cred.additionalUserInfo.profile as any;
        let email = "";
        let avatar = "";
        let displayName = "";

        if (cred.additionalUserInfo.providerId == "google.com") {
            email = profile.email;
            avatar = profile.picture;
            displayName = profile.name;
        }
        if (cred.additionalUserInfo.providerId == "facebook.com") {
            email = profile.email;
            avatar = profile.picture?.data?.url;
            displayName = profile.name;
        }
        if(cred.additionalUserInfo.providerId == "email") {
            email = cred.user.email;
            avatar = cred.user.photoURL;
            displayName = cred.user.email;
        }

        if (email?.trim() == "") {
            this.handleErrors({ code: "no-email" });
        }

        return {
            id: cred.user.uid,
            displayName: displayName,
            email: email,
            avatar: avatar,
            signInMethod: cred.credential.signInMethod,
            providerId: cred.additionalUserInfo.providerId,
            emailSettings: {
                auctionAnnouncements: true,
                bidUpdates: true,
            }
        }
    }

    /** Saves new user to the users collection */
    addNewUser(cred: firebase.auth.UserCredential) {
        // save only when user is authenticated. Because of firestore rules
        from(this.isAuthenticated$)
            .pipe(
                filter(x => !!x),
                take(1)
            ).subscribe(() => {
                const user = this.getNewUser(cred);
                console.log("Saving")
                return this.store.collection(`users`).doc(user.id).set(user, { merge: true }).catch(err => console.log(err));
            })
    }

    getUser(id: string) {
      return this.store.doc(`users/${id}`).valueChanges({idField: 'id'});
    }

    openChangeEmailDialog(message?: string, forcefulOverride = false) {
      const ref = this.dialog.open(ChangeEmailDialogComponent, {
        height: 'auto',
        width: '98%',
        maxWidth: '23rem',
        autoFocus: false,
        closeOnNavigation: true,
        panelClass: "dialog-no-padding",
        data: message
      });

      ref.afterClosed().pipe(take(1))
      .subscribe(email => {
        if(!email) return;

        this.changeEmail(email, forcefulOverride).pipe(take(1)).subscribe(noop, err => console.log(err));
      })
    }

    changeEmail(email: string, forcefulOverride = false) {
      return this.user$
      .pipe(
        take(1),
        concatMap(user => user.updateEmail(email)),
        catchError(err => {

          if(err.code == "auth/requires-recent-login") {
            this.logout().then(
              () => this.toastSvc.warning("Molimo vas prijavite se ponovno i ponovite promjenu e-maila.", {
                duration: 20000,
                dismissible: true,
              })
            );

            return throwError(err);
          }

          this.toastSvc.error("Došlo je do greške molimo vas obratite nam se na mail za pomoć");
          return throwError(err);
        }),
        concatMap(() => this.userId$),
        concatMap(id => this.store.doc(`users/${id}`).update({email, overrideEmail: null})),
        tap(() => {
          this.toastSvc.success("Uspješno izmjenjen e-mail");
        })
      )
    }

}
