import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatDialogModule]
})
export class MessageDialogComponent implements OnInit {


  constructor(
    private readonly dialog: MatDialogRef<MessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string
  ) { }

  ngOnInit(): void {
  }

  onClose() {
    this.dialog.close();
  }

}
