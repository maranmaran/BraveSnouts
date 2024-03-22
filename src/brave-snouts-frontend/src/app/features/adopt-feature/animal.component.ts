import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { GalleryComponent, ImageItem } from 'ng-gallery'
import { Lightbox } from 'ng-gallery/lightbox'
import { Subject, first, interval, map, takeUntil } from 'rxjs'
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
                #gallery
                class="min-h-[250px] hover:cursor-pointer"
                [id]="animal.name"
                [dots]="true"
                [loop]="true"
                [items]="images$ | async"
                [scrollBehavior]="'smooth'"
                [loadingStrategy]="'preload'"
                [thumb]="animal.images.length > 1"
                (mouseleave)="pauseAutoPlay = false"
                (mouseenter)="pauseAutoPlay = true"
                (itemClick)="openLightbox($event, animal)"
            ></gallery>

            <div class="grid grid-rows-[min-content,min-content,1fr] gap-4 h-full p-2">
                <h1 class="justify-self-end font-extrabold">{{animal.name}}</h1>
                <div class="flex flex-row items-center gap-4">
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
                </div>
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

  @ViewChild('gallery', { static: false }) gallery: GalleryComponent;

  public pauseAutoPlay = false;

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

    interval(3000)
      .pipe(takeUntil(this.ngUnsubscribeSubject))
      .subscribe(() => !this.pauseAutoPlay &&
        this.gallery?.next('smooth', true)
      );
  }

  readonly lightbox = inject(Lightbox);

  async openLightbox(mediaIdx: number = 0, animal: Animal) {
    const id = animal.name;

    this.lightbox.open(mediaIdx, id, {
      'panelClass': 'fullscreen',
    });

    history.pushState({ modal: true }, '');

    this.lightbox.closed
      .pipe(first())
      .subscribe(() => {
      });
  }


  ngOnDestroy() {
    this.ngUnsubscribeSubject.next();
  }

  onAdopt(animal: Animal) {
    alert('do form')
  }
}
