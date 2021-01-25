import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material/dialog";
import firebase from 'firebase/app';
import { from, noop, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { LoginMethodComponent } from "src/app/features/auth-feature/login-method/login-method.component";


@Injectable({ providedIn: 'root' })
export class AuthService {

    private _admin: boolean = false;

    constructor(
        private readonly auth: AngularFireAuth,
        private readonly firestore: AngularFirestore,
        private readonly dialog: MatDialog
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
            switchMap(user => user ? this.firestore.doc(`admins/${user.uid}`).valueChanges().pipe(take(1)) : of(null)),
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
            .subscribe(method => {
                if(!method)
                    return;

                if(method == 'gmail') {
                    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(noop);
                }
                if(method == 'facebook') {
                    const facebook = new firebase.auth.FacebookAuthProvider();
                    facebook.addScope('email');
                    facebook.addScope('user_link');
                    facebook.setCustomParameters({
                        'display': 'popup'
                    })

                    this.auth.signInWithPopup(facebook).catch(noop);
                }
            })
        })
    }

    logout() {
        this.auth.signOut();
    }

}
