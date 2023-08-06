import { Component } from '@angular/core';

@Component({
  selector: 'store-container',
  template: `
    <app-toolbar></app-toolbar>
    <div class="container px-4">
      <router-outlet></router-outlet>
    </div> 
  `,
})
export class StoreHomeComponent {
}
