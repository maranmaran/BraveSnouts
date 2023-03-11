import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styles: [`
    textarea {
      display: flex;
      justify-content: center;
      font-size: 18px;
      padding: 5px;
      text-align: center;
      resize: none;
    }
  `]
})
export class SupportComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<ConfirmDialogComponent>,
  ) { }

  ngOnInit(): void {
  }
  onClose() {
    return this.dialog.close();
  }

}
