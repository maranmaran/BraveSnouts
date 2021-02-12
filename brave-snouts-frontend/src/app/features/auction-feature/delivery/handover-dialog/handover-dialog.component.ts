import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-handover-dialog',
  templateUrl: './handover-dialog.component.html',
  styleUrls: ['./handover-dialog.component.scss']
})
export class HandoverDialogComponent implements OnInit {

  constructor(
    private readonly dialog: MatDialogRef<HandoverDialogComponent>,
    private readonly fb: FormBuilder,
  ) { }

  handoverDetails: FormArray;

  ngOnInit(): void {
    this.handoverDetails = this.fb.array([
      this.fb.control(""),
      this.fb.control(""),
    ])
  }

  onAdd() {
    this.handoverDetails.push(this.fb.control(""));
  }

  onClose() {
    return this.dialog.close();
  }

  onSubmit() {
    if(!this.handoverDetails.valid) return;

    return this.dialog.close(this.handoverDetails.value);
  }
}
