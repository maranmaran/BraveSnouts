import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material/dialog";
import firebase from 'firebase/app';
import { from, noop, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { LoginMethodComponent } from "src/app/features/auth-feature/login-method/login-method.component";
import { AuctionItem } from "src/business/models/auction-item.model";
import { environment } from "src/environments/environment";


@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(
        private readonly auth: AngularFireAuth,
        private readonly store: AngularFirestore,
        private readonly dialog: MatDialog,
    ) { }

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
        return this.auth.currentUser.then(user => {

            if (user)
                return;

            let dialogRef = this.dialog.open(LoginMethodComponent, {
                height: 'auto',
                width: '98%',
                maxWidth: '20rem',
                autoFocus: false,
                closeOnNavigation: true
            });

            return dialogRef.afterClosed()
                .pipe(take(1))
                .subscribe(async (login) => login ? await this.doAuth(login.method, login.data) : noop(), err => console.log(err))

        }).catch(err => console.log(err))
    }

    logout() {
        this.auth.signOut();
    }

    /** Handles authentication flow
     * If user chose method then it logs him in
     * Registers user if he's new
     */
    async doAuth(method, data) {

        if (!method)
            return;

        const cred = await this.loginUser(method, data);

        if (cred && cred.additionalUserInfo.isNewUser) {
            await this.addNewUser(cred);
        }
    }

    /** Logs user in depending on method */
    async loginUser(method, data) {
        if (!method) return;

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
            // ...
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

}
