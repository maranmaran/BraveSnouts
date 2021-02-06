import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-login-method',
  templateUrl: './login-method.component.html',
  styleUrls: ['./login-method.component.scss']
})
export class LoginMethodComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<LoginMethodComponent>) { }

  email: FormControl = new FormControl('', [Validators.required, Validators.email]);
  method: 'gmail' | 'facebook' | 'email';

  ngOnInit() {
  }

  selectMethod(method: 'gmail' | 'facebook' | 'email') {
    this.method = method;

    if(method == 'gmail' || method == 'facebook')
      this.onClose({ method, data: null });
  } 

  onSubmit() {
    // send email verification link for mail and wait for 10 seconds before exiting
    if(this.method == 'email' && this.email.valid) {
      let data = { method: this.method, data: { email: this.email.value } };
      this.onClose(data);
    }
  }

  onClose(data?: { method: string, data: any }) {
    return this.dialogRef.close(data);
  }

}
