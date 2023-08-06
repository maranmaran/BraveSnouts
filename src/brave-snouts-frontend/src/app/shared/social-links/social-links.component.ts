import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-social-links',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  styles: [``],
  template: `
    <div class="flex flex-row gap-2">
      <img
        [ngClass]="{ 'invisible': !instagram }"
        class="h-10 w-10 shadow-sm hover:shadow-xl hover:scale-105"
        src="assets/social-logo/instagram.svg"
        matTooltip="Instagram poveznica"
      />

      <img
        [ngClass]="{ 'invisible': !instagram }"
        class="h-10 w-10 shadow-sm hover:shadow-xl hover:scale-105"
        src="assets/social-logo/facebook.svg"
        matTooltip="Facebook poveznica"
      />
    </div>
  `
})
export class SocialLinksComponent {
  @Input() instagram;
  @Input() facebook;
}
