import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';





@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<ConfirmDialogComponent>
  ) { }

  ngOnInit(): void {
  }
  value = `app.hrabrenjuske@gmail.com`;
  onClose(){
    return this.dialog.close();
  }

}
