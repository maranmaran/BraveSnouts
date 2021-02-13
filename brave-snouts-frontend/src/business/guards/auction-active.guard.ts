
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { Observable, of } from "rxjs";
import { map, switchMap, take } from "rxjs/operators";
import { Auction } from "src/business/models/auction.model";
import { AuctionRepository } from "src/business/services/repositories/auction.repository";
import { getAuctionState } from "src/business/services/auction.service";
import { AuthService } from "src/business/services/auth.service";
import { AngularFirestore } from "@angular/fire/firestore";

@Injectable({ providedIn: 'root' })
export class AuctionActiveGuard implements CanActivate {


  private readonly auctionRepo: AuctionRepository;

  constructor(
    private router: Router,
    private readonly firestore: AngularFirestore,
    private readonly authSvc: AuthService,
  ) {
    this.auctionRepo = new AuctionRepository(this.firestore);
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    let auction = this.router.getCurrentNavigation().extras.state?.auction as Auction; 
    let auctionId = next.paramMap.get('id');

    if(!auction && !auctionId) {
      return this.router.navigate(['/app'])
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

        return this.router.navigate(['/app']);
      })
    );
  }

  getAuction(id: string): Observable<Auction> {
    return this.auctionRepo.getOne(id).pipe(take(1));
  }

}


