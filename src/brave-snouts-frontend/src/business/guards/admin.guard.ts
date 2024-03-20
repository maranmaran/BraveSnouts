import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "src/business/services/auth.service";

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const authSvc = inject(AuthService);
  return await firstValueFrom(authSvc.isAdmin$)
    ? true
    : router.navigate(['']);
}