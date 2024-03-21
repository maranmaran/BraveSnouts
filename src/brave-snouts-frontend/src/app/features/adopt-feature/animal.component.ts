import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ImageItem } from 'ng-gallery'
import { Subject, map, takeUntil } from 'rxjs'
import { AdoptApi, Animal } from './adopt.api'

@Component({
  selector: 'app-animal',
  styleUrls: ['./adopt.styles.scss'],
  template: `
        <div
            *ngIf="animal$ | async as animal"
            class="container grid grid-cols-2 sm:grid-cols-1 justify-center align-center gap-4"
        >
            <gallery
                class="min-h-[250px]"
                [dots]="true"
                [loop]="true"
                [autoPlay]="true"
                [thumb]="animal.images.length > 1"
                [id]="animal.name"
                [items]="images$ | async"
            ></gallery>

            <div class="grid grid-rows-[min-content,min-content,1fr] gap-4 h-full p-2">
                <div id="header" class="flex flex-row flex-wrap justify-between gap-8">
                    <span class="font-bold text-2xl flex items-center gap-4"
                        ><mat-icon>pets</mat-icon> {{ animal.name }}</span
                    >
                    <button mat-flat-button (click)="onAdopt(animal)" color="primary">
                        <div class="flex flex-row justify-center items-center gap-2">
                            <mat-icon>pets</mat-icon> <span>Udomi</span> <mat-icon> pets </mat-icon>
                        </div>
                    </button>
                </div>
                <app-social-links
                    *ngIf="animal.instagram || animal.facebook"
                    class="post-socials"
                    [instagram]="animal.instagram"
                    [facebook]="animal.facebook"
                ></app-social-links>
                <div class="prose-xl">{{ animal.description }}</div>
            </div>
        </div>
    `,
})
export class AnimalComponent implements OnInit, OnDestroy {
  private readonly ngUnsubscribeSubject = new Subject<void>();

  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly api = inject(AdoptApi)

  animal$ = this.api.selectedAnimal$
  images$ = this.animal$.pipe(
    map(x => x.images.map(x => new ImageItem({ src: x.original.gUrl, thumb: x.thumbnail.gUrl }))),
  )

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
