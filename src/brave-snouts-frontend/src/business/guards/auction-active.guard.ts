
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { Auction } from "src/business/models/auction.model";
import { getAuctionState } from "src/business/services/auction.service";
import { AuthService } from "src/business/services/auth.service";
import { AuctionRepository } from "src/business/services/repositories/auction.repository";

export const auctionActiveGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authSvc = inject(AuthService);
  const auctionRepo = inject(AuctionRepository);

  const auctionId = route.paramMap.get('id') || route.paramMap.get('auctionId');

  const allow = () => true;
  const deny = () => router.navigate(['/aukcije']);
  const isAuctionActive = (auction: Auction) => getAuctionState(auction) == 'active';

  if (!auctionId) {
    return deny();
  }

  const isAdmin = await firstValueFrom(authSvc.isAdmin$);

  // admin can navigate to any state of auction
  // be it future, active or expired
  if (isAdmin) {
    return allow();
  }

  // if not admin do regular check
  const auction = await getAuction(auctionId, router, auctionRepo);
  return isAuctionActive(auction) ? allow() : deny();
}

const getAuction = async (auctionId: string, router: Router, auctionRepo: AuctionRepository) => {
  const auction = router.getCurrentNavigation().extras.state?.auction as Auction;
  if (auction) {
    return auction;
  }

  return await firstValueFrom(auctionRepo.getOne(auctionId));
}

