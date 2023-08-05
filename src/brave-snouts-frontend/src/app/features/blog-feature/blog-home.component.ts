import { Component } from '@angular/core';
import { ContentfulApiService } from './contentful.api';

@Component({
  selector: 'blog-container',
  template: `
    <router-outlet></router-outlet>
  `,
  providers: [ContentfulApiService]
})
export class BlogHomeComponent {
}
