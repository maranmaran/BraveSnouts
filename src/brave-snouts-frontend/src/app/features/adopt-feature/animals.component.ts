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
    <div class="max-w-7xl w-full grid grid-cols-3 gap-10 self-center items-center justify-center sm:grid-cols-1 lg:grid-cols-2 rounded-md">
          <mat-card *ngFor="let animal of animals$ | async" (click)="navigate(animal)" class="
            max-w-xl justify-self-center w-full
            shadow-lg rounded-b-md flex justify-start p-0 
            transition-all duration-250 cursor-pointer hover:shadow-2xl hover:scale-105
          ">
            <div [ngStyle]="{
                background: 'url(' + animal.images[0].original.gUrl + ') 50% 50% no-repeat',
                'background-size': 'cover',
                'align-self': 'center',
                'height': '250px',
                'width': '100%',
            }" mat-card-image ></div>
            <mat-card-header class="px-4 pt-5 pb-0">
              <mat-card-title class="font-bold text-lg">{{animal.name}}</mat-card-title>
              <mat-card-subtitle class="font-bold text-lg">{{ animal.shortDescription }}</mat-card-subtitle>
            </mat-card-header>
            <div class="flex flex-row gap-4 items-center justify-between">
              <app-social-links class="p-4" [instagram]="animal.instagram" [facebook]="animal.facebook"></app-social-links>
              <div class="flex flex-row flex-wrap gap-1 items-center pr-2 justify-end">
                @for(tag of animal.tags; track tag) {
                  <div class="flex justify-center items-center h-min m-1 font-medium py-1 px-2 rounded-full text-cyan-600 bg-cyan-100 border border-cyan-300 ">
                      <div class="text-sm font-normal leading-none max-w-full flex-initial">{{tag}}</div>
                  </div>
                }
              </div>
            </div> 

        </mat-card>
      </div>
  `
})
export class AnimalsComponent {
  private readonly router = inject(Router);
  private readonly api = inject(AdoptApi);
  readonly animals$ = this.api.animals$;

  navigate(animal: Animal) {
    this.api.selectAnimal(animal);
    this.router.navigate(['udomi', `njusku`, animal.slug])
  }
}
