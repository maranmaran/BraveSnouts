import { Component } from '@angular/core';
import { ContentfulApiService } from './contentful.api';

@Component({
  selector: 'blog-container',
  template: `
    <app-toolbar></app-toolbar>
    <div class="container px-4">
      <router-outlet></router-outlet>
    </div> 
  `,
  providers: [ContentfulApiService]
})
export class BlogHomeComponent {
}
