import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-email-login',
  template: '',
})
export class EmailLoginComponent implements OnInit {

  constructor(
    private readonly authSvc: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.authSvc.completeEmailLogin().then(() => this.router.navigate(['/aukcije']));
  }

}
