import { Component } from '@angular/core';

@Component({
  selector: 'app-container',
  template: `
    <auctions-toolbar></auctions-toolbar>
    <router-outlet></router-outlet>
  `
})
export class AuctionsHomeComponent {
}
