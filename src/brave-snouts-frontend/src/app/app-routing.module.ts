import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'aukcije', pathMatch: 'full' },
  { path: 'aukcije', loadChildren: () => import('./features/auction-feature/auctions.module').then(m => m.AuctionsModule) },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
