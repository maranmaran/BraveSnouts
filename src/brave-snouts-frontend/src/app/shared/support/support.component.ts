import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { EmailCopyComponent } from './email-copy.component';


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
  `],
  standalone: true,
  imports: [MatIconModule, EmailCopyComponent]
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
