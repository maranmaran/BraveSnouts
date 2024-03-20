import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

export const auctionIdGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  return route.paramMap.get('id')
    ? true
    : router.navigate(['/aukcije'])
}