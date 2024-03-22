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
    <div class="flex flex-row gap-4">

    @if(!(removeFromDom && !instagram)) {
      <a [href]="instagram" target="_blank" (click)="$event.stopImmediatePropagation()" [ngClass]="{ 'invisible': !instagram }"><img
        class="h-10 w-10 shadow-sm hover:shadow-xl hover:scale-105 hover:cursor-pointer"
        src="assets/social-logo/instagram.svg"
        matTooltip="Instagram poveznica"
      /></a>
    }

    @if(!(removeFromDom && !facebook)) {
        <a [href]="facebook" target="_blank" (click)="$event.stopImmediatePropagation()" [ngClass]="{ 'invisible': !facebook }"><img
          class="h-10 w-10 shadow-sm hover:shadow-xl hover:scale-105 hover:cursor-pointer"
          src="assets/social-logo/facebook.svg"
          matTooltip="Facebook poveznica"
        /></a>
      }
    </div>
  `
})
export class SocialLinksComponent {
  @Input() instagram;
  @Input() facebook;
  @Input() removeFromDom = false
}
