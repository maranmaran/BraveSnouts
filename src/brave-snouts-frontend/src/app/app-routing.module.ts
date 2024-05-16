import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard } from 'src/business/guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'aukcije', pathMatch: 'full' },
  { path: 'aukcije', loadChildren: () => import('./features/auction-feature/auctions.module').then(m => m.AuctionsModule) },
  { path: 'pocetna', canActivate: [adminGuard], loadChildren: () => import('./features/web-feature/web.module').then(m => m.WebModule) },
  // { path: 'blog', canActivate: [adminGuard], loadChildren: () => import('./features/blog-feature/blog.module').then(m => m.BlogModule) },
  // { path: 'merch', canActivate: [adminGuard], loadChildren: () => import('./features/store-feature/store.module').then(m => m.StoreModule) },
  // { path: 'udomi', canActivate: [adminGuard], loadChildren: () => import('./features/adopt-feature/adopt.module').then(m => m.AdoptModule) },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
