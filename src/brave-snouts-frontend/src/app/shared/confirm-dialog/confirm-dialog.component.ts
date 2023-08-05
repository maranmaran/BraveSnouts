import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatIconModule]
})
export class ConfirmDialogComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string, yes: string, no: string }
  ) { }

  ngOnInit(): void {
  }

  onClose(confirm = false) {
    return this.dialog.close(confirm);
  }

}
