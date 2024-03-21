import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const auctionFormGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const data = router.getCurrentNavigation().extras.state;

  if (!data) {
    return router.navigate(['/aukcije'])
  }

  if (!data.auction || !data.items || !data.action) {
    return router.navigate(['/aukcije'])
  }

  return true;
}
