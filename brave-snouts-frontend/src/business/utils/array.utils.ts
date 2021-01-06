 /**
   * Checks if two given arrays are the same 
   */
export function areSameItemArrays(prev, cur) {
    if(prev.length != cur.length) 
      return false;

    try {
      let idsPrev = (prev.map(i => i.id) as string[]).sort();
      let idsCur = (cur.map(i => i.id) as string[]).sort();
  
      return idsPrev.join('') == idsCur.join('');
    } 
    catch { return false; }
  }