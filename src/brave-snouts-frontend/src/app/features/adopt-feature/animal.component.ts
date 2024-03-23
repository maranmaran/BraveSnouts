import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdoptApi, Animal } from './adopt.api';

@Component({
  selector: 'app-animal',
  styleUrls: ['./adopt.styles.scss'],
  template: `
    @if(animal$ | async; as animal) {
      <div class="container grid grid-cols-2 sm:grid-cols-1 justify-center align-center gap-4">
          <bs-media-gallery
              #gallery
              class="min-h-[250px] hover:cursor-pointer"
              [id]="animal.name"
              [media]="animal.images"
              [config]="{
                dots: true,
                loop: true,
                thumb: animal.images.length > 1,
              }"
          ></bs-media-gallery>

          <div class="grid grid-rows-[min-content,min-content,1fr] gap-4 h-full p-2">
              <h1 class="justify-self-end font-extrabold md:justify-self-center">{{animal.name}}</h1>
              <div class="flex flex-row md:flex-col justify-between">
                <span class="flex flex-row items-center gap-4">
                  <app-social-links
                      *ngIf="animal.instagram || animal.facebook"
                      class="post-socials"
                      [removeFromDom]="true"
                      [instagram]="animal.instagram"
                      [facebook]="animal.facebook"
                  ></app-social-links>
                  <button mat-flat-button (click)="onAdopt(animal)" color="primary" class="justify-self-end relative top-[5px]">
                    <div class="flex flex-row justify-center items-center gap-2">
                        <mat-icon>pets</mat-icon> <span>Udomi</span> <mat-icon> pets </mat-icon>
                    </div>
                  </button>
                </span>

                <span class="flex flex-row items-center gap-4 md:justify-center">
                  <div class="flex flex-row gap-1 items-center pr-2 justify-end">
                    @for(tag of animal.tags; track tag) {
                      <div class="flex justify-center items-center h-min m-1 font-medium py-1 px-2 rounded-full text-cyan-600 bg-cyan-100 border border-cyan-300 ">
                          <div class="text-sm font-normal leading-none max-w-full flex-initial">{{tag}}</div>
                      </div>
                    }
                  </div>
                </span>
              </div>
              <div class="prose-xl" [innerHTML]="animal.description"></div>
          </div>
      </div>
    }
    `,
})
export class AnimalComponent implements OnInit, OnDestroy {
  private readonly ngUnsubscribeSubject = new Subject<void>();

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly api = inject(AdoptApi)

  animal$ = this.api.selectedAnimal$

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (!this.api.selectedAnimal) {
      const slug = this.route.snapshot.params.id
      this.api
        .getAnimal(slug)
        .pipe(takeUntil(this.ngUnsubscribeSubject))
        .subscribe({
          next: animal => this.api.selectAnimal(animal),
          error: _ => this.router.navigate(['udomi']),
        })
    }
  }

  ngOnDestroy() {
    this.ngUnsubscribeSubject.next();
  }

  onAdopt(animal: Animal) {
    alert('do form')
  }
}
