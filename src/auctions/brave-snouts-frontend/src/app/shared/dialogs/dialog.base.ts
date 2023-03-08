import { MatDialogRef } from '@angular/material/dialog';
import { first } from 'rxjs/operators';

export class DialogBase {
  constructor(private readonly dialogRef: MatDialogRef<any>) {
    this.handleBackKey();
  }

  handleBackKey() {
    window.history.pushState(null, 'Back', window.location.href);

    this.dialogRef
      .afterClosed()
      .pipe(first())
      .subscribe((res) => {
        window.onpopstate = null;
        window.history.go(-1);
      });

    window.onpopstate = () => {
      this.dialogRef.close();
      window.history.pushState(null, 'Back', window.location.href);
    };
  }
}
