import { Component } from '@angular/core';

@Component({
  selector: 'blog-home',
  styles: [`
    .container {
            height: calc(100% - 66px - 1rem) !important;
        }
  `],
  template: `
    <app-toolbar></app-toolbar>
    <div class="container px-4">
      <router-outlet></router-outlet>
    </div> 
  `,
})
export class BlogHomeComponent {
}
