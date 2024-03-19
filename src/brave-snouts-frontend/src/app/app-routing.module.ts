import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from 'src/business/guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: 'aukcije', pathMatch: 'full' },
  { path: 'aukcije', loadChildren: () => import('./features/auction-feature/auctions.module').then(m => m.AuctionsModule) },
  { path: 'web', canActivate: [AdminGuard], loadChildren: () => import('./features/web-feature/web.module').then(m => m.WebModule) },
  { path: 'blog', canActivate: [AdminGuard], loadChildren: () => import('./features/blog-feature/blog.module').then(m => m.BlogModule) },
  { path: 'merch', canActivate: [AdminGuard], loadChildren: () => import('./features/store-feature/store.module').then(m => m.StoreModule) },
  { path: 'udomi', canActivate: [AdminGuard], loadChildren: () => import('./features/adopt-feature/adopt.module').then(m => m.AdoptModule) },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
