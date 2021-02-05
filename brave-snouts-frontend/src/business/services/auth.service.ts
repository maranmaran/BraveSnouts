import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material/dialog";
import { HotToastService } from "@ngneat/hot-toast";
import firebase from 'firebase/app';
import { BehaviorSubject, from, noop, of, ReplaySubject } from "rxjs";
import { concatMap, map, mergeMap, switchMap, take } from "rxjs/operators";
import { LoginMethodComponent } from "src/app/features/auth-feature/login-method/login-method.component";
import { AuctionItem } from "src/business/models/auction-item.model";
import { User } from "src/business/models/user.model";
import { environment } from "src/environments/environment";


@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(
        private readonly auth: AngularFireAuth,
        private readonly store: AngularFirestore,
        private readonly dialog: MatDialog,
        private toastSvc: HotToastService
    ) { 
    }

    public get user$() {
        return this.auth.user;
    }

    public get userId$() {
        return this.auth.user.pipe(map(user => user?.uid));
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
                        return of(null);

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
                            switchMap(login => login ? from(this.doAuth(login.method, login.data)) : of(null) )
                        )
                }),
                // concatMap(cred => cred ? this.getUserInternalInformation(cred.user.uid) : of(null))
            )
            .subscribe(noop);
            // .subscribe(userData => {
            //     if(!userData)
            //         return;

            //     this._internalUserInformation.next(userData);
            // })
    }

    /** This refers to users collection in firebase */
    getUserInformation() {
        return this.user$.pipe(
            switchMap(user => this.store.doc<User>(`users/${user.uid}`)
                                        .valueChanges({ idField: 'id'  })
                                        .pipe(take(1))
            )
        )
    }

    logout() {
        this.auth.signOut();
    }

    /** Handles authentication flow
     * If user chose method then it logs him in
     * Registers user if he's new
     */
    async doAuth(method, data): Promise<firebase.auth.UserCredential>  {

        const cred = await this.loginUser(method, data);

        if (cred && cred.additionalUserInfo.isNewUser) {
            await this.addNewUser(cred);
        }

        return cred;
    }

    /** Logs user in depending on method */
    async loginUser(method, data) {

        let cred: firebase.auth.UserCredential = null;

        switch (method) {
            case 'gmail':
                cred = await this.handleGmailLogin();
                break;
            case 'facebook':
                cred = await this.handleFacebookLogin();
                break;
            case 'instagram':
                cred = await this.handleInstagramLogin();
                break;
            case 'email':
                await this.handleEmailLogin(data.email);
                break;
            default:
                break;
        }

        return cred;
    }

    handleGmailLogin(): Promise<firebase.auth.UserCredential> {
        const google = new firebase.auth.GoogleAuthProvider();

        return this.auth.signInWithPopup(google);
    }

    handleFacebookLogin(): Promise<firebase.auth.UserCredential> {
        const facebook = new firebase.auth.FacebookAuthProvider();
        facebook.addScope('email');
        facebook.addScope('user_link');
        facebook.setCustomParameters({
            'display': 'popup'
        })

        return this.auth.signInWithPopup(facebook);
    }

    handleInstagramLogin(): Promise<firebase.auth.UserCredential> {
        throw new Error("Not implemented");
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
                position: "bottom-center"
            })
        }).catch(err => {
            console.log(err);
            this.toastSvc.error("Imali smo poteškoća sa prijavom. Molimo vas pokušajte ponovno ili nas kontaktirajte.", {
                duration: 10000,
                dismissible: true,
                autoClose: true,
                position: "bottom-center"
            })
        });
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
            email = window.prompt('Please provide your email for confirmation');
        }
        // The client SDK will parse the code from the link for you.
        return this.auth.signInWithEmailLink(email, window.location.href)
            .then(async (cred) => {
                // Clear email from storage.
                window.localStorage.removeItem('emailForSignIn');

                // You can access the new user via result.user
                // Additional user info profile not available via:
                // result.additionalUserInfo.profile == null
                // You can check if the user is new or existing:
                // result.additionalUserInfo.isNewUser
                if (cred && cred.additionalUserInfo.isNewUser) {

                    cred = {
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

                    await this.addNewUser(cred);
                }
            })
            .catch((err) => (console.log(err), window.alert("Neispravan email ili iskorišten link")));
    }

    /** Saves new user to the users collection */
    addNewUser(cred: firebase.auth.UserCredential) {
        let user = {
            id: cred.user.uid,
            displayName: cred.user.displayName,
            email: cred.user.email,
            avatar: cred.user.photoURL,
            signInMethod: cred.credential.signInMethod,
            providerId: cred.credential.providerId,
            emailSettings: {
                auctionAnnouncements: true,
                bidUpdates: true,
            }
        }

        return this.store.collection(`users`).doc(user.id).set(user);
    }

    /** Adds item on which user bid on to the database */
    addItemToUser(item: AuctionItem, userId: string) {
        return this.store.collection(`users/${userId}/tracked-items`)
            .doc(item.id).set({
                auctionId: item.auctionId,
                itemId: item.id,
                userId: userId,
            });
    }

    /** Retrieves only items on which user bid on */
    getUserItems(userId: string) {
        return this.store.collection(`users/${userId}/tracked-items`)
            .valueChanges({ idField: 'id' })
    }

    deleteTrackedItems(auctionId: string) {
        return this.store.collectionGroup("tracked-items", ref => ref.where("auctionId", "==", auctionId))
            .valueChanges()
            .pipe(
                take(1),
                mergeMap(items => [...items]),
                mergeMap((item: any) => this.store.doc(`users/${item.userId}/tracked-items/${item.itemId}`).delete())
            )
    }

}
