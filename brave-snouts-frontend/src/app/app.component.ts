import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/business/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  
  constructor(
    private readonly authSvc: AuthService
  ) {
  }

  /** 
   * HOLDS VERY IMPORTANT LOGIC FOR AUTH 
   * HAD TROUBLES signing in through FACEBOOK & INSTAGRAM mobile applications
   * Since they open their own little browser signInWithPopup had some flaws and resulted in blank screen
   * 
   * Cure is probably signInWithRedirect but it needs special handling
   * */
  ngOnInit(): void {
    this.authSvc.completeSocialLogin();
  }


}
