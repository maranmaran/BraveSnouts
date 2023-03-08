import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-change-email-dialog',
  templateUrl: './change-email-dialog.component.html',
  styleUrls: ['./change-email-dialog.component.scss']
})
export class ChangeEmailDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ChangeEmailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string
  ) { }

  email: FormControl = new FormControl('', [Validators.required, Validators.email]);

  ngOnInit() {
  }

  onSubmit() {
    if(!this.email.valid) return;

    return this.dialogRef.close(this.email.value);
  }

  onClose() {
    return this.dialogRef.close(null);
  }

}
