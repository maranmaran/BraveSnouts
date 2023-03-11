
import firebase from 'firebase/compat/app';
import 'firebase/firestore';

export abstract class RepositoryBase {

  get timestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

}
