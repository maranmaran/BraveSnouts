import { DocumentChangeAction } from "@angular/fire/firestore";
import { AuctionItem } from "src/business/models/auction-item.model";

/** Unionizes two auction item arrays to reflect new changes */
export function mergeArrays(originalArr: AuctionItem[], nextArr: DocumentChangeAction<AuctionItem>[]) {

    let original = originalArr ? [...originalArr] : [];
    let next = nextArr ? [...nextArr] : [];

    // no new documents
    if (!next || next.length == 0)
      return original;

    // only new documents - init
    if (!original || original.length == 0)
      return next.map(item => item.payload.doc.data());


    // both collections exist - add new ones, update modified ones
    for (const document of next) {

      let idx = original.findIndex(item => item.id == document.payload.doc.id);

      // new document
      if (idx == -1) {
        original.push(document.payload.doc.data());
        console.log("Added");
      }
      // modified document
      else if (document.type == 'modified') {
        original[idx] = document.payload.doc.data();
        console.log('Modified');
      }

    }

    return original;

  }