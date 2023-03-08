// async handleGmailLogin() {
//   const google = new firebase.auth.GoogleAuthProvider();
//   google.addScope('profile');
//   google.addScope('email');

//   google.setCustomParameters({ prompt: 'select_account' })

//   // return await this.auth.signInWithPopup(google);

//   await this.auth.signInWithRedirect(google);
//   return null;
// }

// async handleFacebookLogin(): Promise<firebase.auth.UserCredential> {
//   const facebook = new firebase.auth.FacebookAuthProvider();
//   facebook.addScope('email');
//   // facebook.addScope('user_link');

//   // return this.auth.signInWithPopup(facebook)
//   // .then(cred => {
//   //     console.log(cred);

//   //     if(!cred?.user?.email || cred?.user?.email?.trim() == "") {
//   //         throw { code: "no-email"};
//   //     }

//   //     return cred;
//   // })

//   await this.auth.signInWithRedirect(facebook);
//   const cred = await this.auth.getRedirectResult()
//       .then(cred => {
//           // console.log(cred);

//           if (!cred?.user?.email || cred?.user?.email?.trim() == "") {
//               throw { code: "no-email" };
//           }

//           return cred;
//       })

//   return null;
// }

// async completeSocialLogin() {

//   if (!this._usingRedirectFlag) {
//       return;
//   }

//   await this.auth.getRedirectResult()
//       .then(cred => {
//           // console.log(cred);

//           if ((cred as any).code) {
//               this.handleErrors(cred);
//               return;
//           }

//           if (cred == null || cred.user == null || cred.additionalUserInfo?.profile == null) {
//               return;
//           }

//           const profile = cred.additionalUserInfo.profile as any;
//           // console.log(profile);

//           if (!profile.email || profile.email?.trim() == "") {
//               this.handleErrors({ code: "no-email" });
//               return;
//           }

//           if (cred && cred.additionalUserInfo.isNewUser) {
//               this.addNewUser(cred);
//           }
//       })
//       .catch(err => {

//           if (err.code == "auth/account-exists-with-different-credential") {
//               this.handleErrors({ code: err.code })
//           }

//           if (err.code) {
//               this.handleErrors(err);
//           }
//       })
// }
