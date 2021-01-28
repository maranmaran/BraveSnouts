import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material/dialog";
import firebase from 'firebase/app';
import { from, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { LoginMethodComponent } from "src/app/features/auth-feature/login-method/login-method.component";
import { AuctionItem } from "src/business/models/auction-item.model";


@Injectable({ providedIn: 'root' })
export class AuthService {

    private _admin: boolean = false;

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

            return dialogRef.afterClosed().pipe(take(1))
            .subscribe(async method => {
                if(!method)
                    return;

                let cred: firebase.auth.UserCredential = null;
                if(method == 'gmail') {
                    cred = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
                }
                if(method == 'facebook') {
                    const facebook = new firebase.auth.FacebookAuthProvider();
                    facebook.addScope('email');
                    facebook.addScope('user_link');
                    facebook.setCustomParameters({
                        'display': 'popup'
                    })

                    cred = await this.auth.signInWithPopup(facebook);
                }

                if(cred && cred.additionalUserInfo.isNewUser) {
                    this.addNewUser(cred);
                }
            }, err => console.log(err))
        }).catch(err => console.log(err))
    }

    logout() {
        this.auth.signOut();
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
        }
        this.store.collection(`users`).doc(user.id).set(user);
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
