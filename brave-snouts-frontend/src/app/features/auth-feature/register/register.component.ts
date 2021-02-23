import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {


  constructor(
    private dialogRef: MatDialogRef<RegisterComponent>,
    @Inject(MAT_DIALOG_DATA) public email: string,
    private readonly fb: FormBuilder
  ) { }

  registerForm: FormGroup

  ngOnInit(): void {

    this.registerForm = this.fb.group({
      email: this.fb.control(this.email, [Validators.required, Validators.email]),
      name: this.fb.control('', Validators.required),
      phone: this.fb.control('', Validators.required),
    })
  }

  onSubmit() {
    if(!this.registerForm.valid) {
      return;
    }

    this.dialogRef.close(this.registerForm.value);
  }

}
