import { DocumentChangeAction, QueryDocumentSnapshot } from "@angular/fire/compat/firestore";
import { AuctionItem } from "src/business/models/auction-item.model";

/** Unionizes two auction item arrays to reflect new changes */
export function mergeArrays(original: AuctionItem[], next: DocumentChangeAction<AuctionItem>[]) {

  // no new documents
  if (!next || next.length == 0)
    return original;

  // only new documents - init
  if (!original || original.length == 0) {
    return next.map(document => getFullDocument(document.payload.doc));
  }

  // both collections exist - add new ones, update modified ones
  for (const document of next) {

    let idx = original.findIndex(item => item.id == document.payload.doc.id);

    // new document
    if (idx == -1) {
      original.push(getFullDocument(document.payload.doc));
    }
    // modified document
    else if (document.type == 'modified') {
      original[idx] = getFullDocument(document.payload.doc);
    }

  }

  // return new array to trigger onChanges
  return [...original];

}

function getFullDocument(doc: QueryDocumentSnapshot<AuctionItem>) {
  return { id: doc.id, ...doc.data() };
}