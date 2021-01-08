import { Injectable } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { from, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AuthService } from "src/business/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    return this.authService.isAdmin$.pipe(
        switchMap(result => {

            if(!result) {
                return of(false);
            }
            
            return of(true);
        })
    );

  }

}