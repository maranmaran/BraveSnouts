import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login-method',
  templateUrl: './login-method.component.html',
  styleUrls: ['./login-method.component.scss']
})
export class LoginMethodComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<LoginMethodComponent>) { }


  ngOnInit() {
  }

  onClose(method: 'gmail' | 'facebook' = null) {
    return this.dialogRef.close(method);
  }

}
