import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'blog', pathMatch: 'full' },
  { path: 'aukcije', loadChildren: () => import('./features/auction-feature/auctions.module').then(m => m.AuctionsModule) },
  { path: 'web', loadChildren: () => import('./features/web-feature/web.module').then(m => m.WebModule) },
  { path: 'blog', loadChildren: () => import('./features/blog-feature/blog.module').then(m => m.BlogModule) },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
