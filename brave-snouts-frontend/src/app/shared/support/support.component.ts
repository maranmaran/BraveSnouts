import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HotToastService } from '@ngneat/hot-toast';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';





@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<ConfirmDialogComponent>,
    private readonly toastSvc: HotToastService
  ) { }

  ngOnInit(): void {
  }
  value = `app.hrabrenjuske@gmail.com`;
  onClose(){
    return this.dialog.close();
  }

  onCopyFinished(success) {
    if(success) {
      this.toastSvc.success("Email je kopiran", {
        dismissible: true,
        position: 'bottom-center',
      })
    } else {
      this.toastSvc.success("Email se nije uspio kopirati", {
        dismissible: true,
        position: 'bottom-center'
      })
    }
  }
}
