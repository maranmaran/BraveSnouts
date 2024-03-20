import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "src/business/services/auth.service";

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authSvc = inject(AuthService);
  return firstValueFrom(authSvc.isAuthenticated$)
    ? true
    : router.navigate(['/aukcije']);
}

