import { Injectable } from "@angular/core";
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable, of } from "rxjs";
import { take } from "rxjs/internal/operators/take";
import { concatMap, map, switchMap } from "rxjs/operators";
import { Auction } from "src/business/models/auction.model";
import { AuctionRepository } from "src/business/services/auction.repository";
import { getAuctionState } from "src/business/services/auction.service";
import { AuthService } from "src/business/services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuctionActiveGuard implements CanActivate {

  constructor(
    private router: Router,
    private readonly auctionRepo: AuctionRepository,
    private readonly authSvc: AuthService,
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    let auction = this.router.getCurrentNavigation().extras.state?.auction as Auction; 
    let auctionId = next.paramMap.get('id');

    if(!auction && !auctionId) {
      return this.router.navigate([''])
    }

    return this.authSvc.isAdmin$.pipe(
      switchMap(admin => {
        // admin can navigate to any state of auction
        // be it future, active or expired
        if(admin) return of(true);

        // if not admin do regular check

        if(!auction) {
          let auction$ = this.getAuction(auctionId);
    
          return auction$.pipe(map(auction => getAuctionState(auction) == 'active'));
        }
    
        return of(getAuctionState(auction) == 'active');
      }),
      switchMap(canNavigate => {
        if(canNavigate) return of(true);

        return this.router.navigate(['']);
      })
    );
  }

  getAuction(id: string): Observable<Auction> {
    return this.auctionRepo.getOne(id).pipe(take(1));
  }

}


