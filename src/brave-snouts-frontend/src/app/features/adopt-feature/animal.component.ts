import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs';
import { Animal, AdoptApi as ContentfulApi } from './adopt.api';

@Component({
  selector: 'app-animal',
  styleUrls: ['./adopt.styles.scss'],
  styles: [
    `
    `
  ],
  template: `
   <div *ngIf="animal$ | async as animal" class="grid grid-cols-2 sm:grid-cols-1 justify-center align-center gap-12">
        <img
            class="w-full h-full"
            [src]="animal.images[0]"
        />
        <div class="grid grid-rows-[min-content,1fr,1fr] gap-4 h-full">

          <div class="flex flex-row justify-between gap-8">
            <span class="font-bold text-lg">{{ animal.name }}</span>
            <app-social-links class="post-socials" [instagram]="animal.instagram" [facebook]="animal.facebook"></app-social-links>
          </div> 
          <div>{{ animal.description }}</div> 

            <button
            class="w-full"
            mat-flat-button
            type="button"
            (click)="onAdopt(animal)"
            color="primary"
        >
            <div class="flex flex-row justify-center items-center gap-2">
                <mat-icon> pets </mat-icon> <span>Udomi</span>
                <mat-icon> pets </mat-icon>
            </div>
        </button>
        </div> 
    </div>
  `
})
export class AnimalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentfulApi);

  animal$ = this.api.selectedAnimal$;

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!this.api.selectedAnimal) {
      const slug = this.route.snapshot.params.id;
      this.api.getAnimal(slug)
        .pipe(first())
        .subscribe({
          next: animal => this.api.selectAnimal(animal),
          error: _ => this.router.navigate(['udomi'])
        });
    }
  }

  onAdopt(animal: Animal) {
    alert('do form');
  }

}
