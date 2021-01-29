
import * as firebase from 'firebase/app';

export abstract class RepositoryBase {

  get timestamp() {
    return firebase.default.firestore.FieldValue.serverTimestamp();
  }

}
