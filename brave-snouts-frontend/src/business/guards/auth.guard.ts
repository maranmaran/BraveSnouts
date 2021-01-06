import { Injectable } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { from, Observable } from "rxjs";
import { of } from "rxjs/internal/observable/of";
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
                return from(this.router.navigate(['/']));
            }
            
            return of(true);
        })
    );

  }

}
