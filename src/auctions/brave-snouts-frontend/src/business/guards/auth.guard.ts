import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { of } from "rxjs";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AuthService } from "src/business/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    return this.authService.isAuthenticated$.pipe(
        switchMap(result => {

            if(!result) {
                return from(this.router.navigate(['/app']));
            }
            
            return of(true);
        })
    );

  }

}
