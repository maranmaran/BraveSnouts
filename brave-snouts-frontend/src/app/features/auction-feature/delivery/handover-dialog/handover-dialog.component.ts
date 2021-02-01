import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-handover-dialog',
  templateUrl: './handover-dialog.component.html',
  styleUrls: ['./handover-dialog.component.scss']
})
export class HandoverDialogComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<HandoverDialogComponent>,
  ) { }

  handoverDetails: FormControl;

  ngOnInit(): void {
    this.handoverDetails = new FormControl('', Validators.required);
  }

  onClose() {
    return this.dialog.close();
  }

  onSubmit() {
    if(!this.handoverDetails.valid) return;

    return this.dialog.close(this.handoverDetails.value);
  }
}
