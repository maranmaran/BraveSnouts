import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { of } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AuctionFormGuard implements CanActivate {

  constructor(
    private router: Router,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    let data = this.router.getCurrentNavigation().extras.state; 

    if(!data) {
      return this.router.navigate(['/app'])
    }

    if(!data.auction || !data.items || !data.action) {
      return this.router.navigate(['/app'])
    }
    
    return of(true);
  }

}
