import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { of } from "rxjs";


@Injectable({ providedIn: 'root' })
export class AuctionIdGuard implements CanActivate {

  constructor(
    private router: Router,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    let auctionId = next.paramMap.get('id');

    if(!auctionId) {
      return this.router.navigate([''])
    }

    return of(true);
  }

}