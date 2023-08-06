import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdoptApi, Animal } from './adopt.api';

@Component({
  selector: 'app-animals',
  styleUrls: ['./adopt.styles.scss'],
  styles: [`
    :host { @apply flex flex-col p-4 }
  `],
  template: `
    <div class="w-full grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2">
          <mat-card *ngFor="let animal of animals$ | async" (click)="navigate(animal)" class="
            max-w-xl justify-self-center w-full
            shadow-lg rounded-b-md flex justify-start p-0 
            transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
          ">
            <div [ngStyle]="{
                background: 'url(' + animal.images[0] + ') 50% 50% no-repeat',
                'background-size': 'cover',
                'align-self': 'center',
                'height': '250px',
                'width': '100%',
            }" mat-card-image ></div>
            <mat-card-header class="px-4 pt-5 pb-0">
              <mat-card-title class="font-bold text-lg">{{animal.name}}</mat-card-title>
            </mat-card-header>
            <app-social-links class="p-4" [instagram]="animal.instagram" [facebook]="animal.facebook"></app-social-links>
        </mat-card>
      </div>
  `
})
export class AnimalsComponent {
  private readonly router = inject(Router);
  private readonly api = inject(AdoptApi);
  readonly animals$ = this.api.getAnimals();

  navigate(animal: Animal) {
    const slug = animal.slug;
    this.api.selectAnimal(animal);
    this.router.navigate(['udomi', `njuska`, slug])
  }
}
