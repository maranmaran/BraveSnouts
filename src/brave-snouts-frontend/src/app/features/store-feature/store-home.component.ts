import { Component } from '@angular/core';
import { StripeApi } from './stripe.api';

@Component({
  selector: 'store-container',
  template: `
    <app-toolbar></app-toolbar>
    <div class="container px-4">
      <router-outlet></router-outlet>
    </div> 
  `,
  providers: [StripeApi]
})
export class StoreHomeComponent {
}
