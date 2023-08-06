import { Component } from '@angular/core';

@Component({
  selector: 'blog-container',
  template: `
    <app-toolbar></app-toolbar>
    <router-outlet></router-outlet>
  `,
})
export class AdoptHomeComponent {
}
