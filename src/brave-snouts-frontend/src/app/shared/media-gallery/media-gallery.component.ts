import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, computed, effect, inject, input, signal } from '@angular/core'
import { GALLERY_CONFIG, Gallery, GalleryConfig, GalleryModule, ImageItemData } from 'ng-gallery'
import { LIGHTBOX_CONFIG, Lightbox, LightboxConfig, LightboxModule } from 'ng-gallery/lightbox'
import { Subject, filter, first, firstValueFrom, interval, of, switchMap, takeUntil } from 'rxjs'
import { FirebaseImagePipe } from 'src/app/shared/media-gallery/firebase-image.pipe'
import { FirebaseFile } from 'src/business/models/firebase-file.model'
import { environment } from 'src/environments/environment'

export const DEFAULT_GALLERY_CONFIG: GalleryConfig = {
  imageSize: 'contain',
  scrollBehavior: 'smooth',
  loadingStrategy: 'preload',

  itemAutosize: false,
  autoHeight: false,

  dots: false,
  counter: false,
  thumb: false,
  loop: false,

  debug: !environment.production,
}

const DEFAULT_LIGHTBOX_CONFIG: LightboxConfig = {
  // defaults..
  panelClass: 'fullscreen',
  keyboardShortcuts: true,
}

@Component({
  selector: 'bs-media-gallery',
  standalone: true,
  imports: [CommonModule, GalleryModule, LightboxModule, FirebaseImagePipe],
  providers: [
    FirebaseImagePipe,
    { provide: GALLERY_CONFIG, useValue: DEFAULT_GALLERY_CONFIG },
    { provide: LIGHTBOX_CONFIG, useValue: DEFAULT_LIGHTBOX_CONFIG },
  ],
  styles: `
        :host {
            @apply flex justify-center items-center;
        }

        .media {
            @apply w-full h-full cursor-pointer;
        }

        .tile {
            @apply h-full w-auto;
        }

        img,
        video {
            width: 100%;
        }
    `,
  template: `
        <!-- <div class="flex flex-col gap-2">
        <div>{{ 'No media ' +  empty() }}</div>
        <div>{{ 'Use single ' +  useSingle() + ' ' + media().length }}</div>
        <div>{{ 'Use gallery ' +  useGallery() + ' ' + media().length }}</div>
      </div> -->

        @if (!this.files || this.files.length == 0) {
            <i class="text-gray-500">No images</i>
        }

        @if (this.useGallery) {
            <gallery
                class="media"
                [id]="galleryId"
                (mouseenter)="loopPaused.set(true)"
                (mouseleave)="loopPaused.set(false)"
                (itemClick)="openLightbox($event)"
            >
            </gallery>
        }

        @if (this.useTiles) {
            <img
                class="tile"
                [src]="tileMedia()?.thumb"
                [ngStyle]="{
                    background: 'url(' + tileMedia()?.thumb + ') 50% 50% no-repeat',
                    'background-size': 'contain'
                }"
            />
        }
        <!-- <img 
          id="single-image"
          class="img-fluid"
          [ngStyle]="{
              background: 'url(' + image.thumb + ') 50% 50% no-repeat',
              'background-size': 'contain'
          }"
          [src]="image.thumb"/> -->
        <!-- <img
            *ngIf="media.length == 1 && (media[0] | firebaseImage | async) as image"
            class="w-full h-full single-gallery-image cursor-pointer"
            (click)="openLightbox()"
            [ngStyle]="{
                background: 'url(' + image.thumb + ') 50% 50% no-repeat',
                'background-size': 'contain'
            }"
            [src]="image.src"
        /> -->
    `,
})
export class MediaGalleryModule implements OnInit, OnDestroy {

  private readonly gallery = inject(Gallery)
  private readonly lightbox = inject(Lightbox)
  private readonly FbToGalleryMapper = inject(FirebaseImagePipe)

  @Input() galleryId = ''
  @Input('media') files = <FirebaseFile[]>[];
  @Input('tiles') tiles = false;
  @Input('tileIdx') tileIdx?: number = null;
  readonly config = input(DEFAULT_GALLERY_CONFIG, {
    transform: (input: GalleryConfig) => ({
      ...this.gallery.config,
      ...DEFAULT_GALLERY_CONFIG,
      ...input
    })
  });

  @Output() opened = new EventEmitter<void>()
  @Output() closed = new EventEmitter<void>()

  // galleryId = input<string>();
  // tiles = input<boolean>(false);
  // files = input<FirebaseFile[]>([]);
  // forceIdx? = input<number | null>(null);
  // config = input<GalleryConfig>(DEFAULT_GALLERY_CONFIG);

  get useTiles() { return this.tiles };
  get useGallery() { return !this.useTiles };

  readonly galleryMedia = signal([] as ImageItemData[])
  readonly tileMedia = computed(() => this.galleryMedia()?.[this.tileIdx])

  readonly ref = () => this.gallery.ref(this.galleryId, this.config())

  constructor() {
    effect(() => this.config().loop && this.setupLoop());
  }

  async ngOnInit() {
    if (!this.files || this.files.length == 0) {
      return console.warn('No media to render')
    }

    if (this.useTiles && this.tileIdx >= this.files.length) {
      throw new Error('Given index is bigger than media array length')
    }

    await this.setupGallery();
  }

  ngOnDestroy() {
    this.ref().destroy()
    this.loopSubscribe.next()
  }

  async openLightbox(mediaIdx: number = 0) {
    const forceHighQuality = !this.useTiles; // TODO: ???

    await this.setupGallery(forceHighQuality)
    this.lightbox.open(mediaIdx, this.galleryId, { panelClass: 'fullscreen' })

    this.opened.emit()
    history.pushState({ modal: true }, '')

    this.lightbox.closed
      .pipe(
        first(),
        switchMap(() => this.setupGallery()),
      )
      .subscribe(() => this.closed.emit())
  }

  private async setupGallery(forceHighQuality = false) {
    this.ref().reset();

    await this.setMedia(forceHighQuality)

    for (const media of this.galleryMedia()) {
      if (media.type == 'image') this.ref().addImage(media)
      if (media.type == 'video') this.ref().addVideo(media)
    }

    this.ref().set(0, 'instant');
  }

  private async setMedia(forceHighQuality = false) {
    this.galleryMedia.set(
      await firstValueFrom(
        of(this.files).pipe(
          switchMap(files => this.FbToGalleryMapper.transformArr(files, forceHighQuality)),
        ),
      ),
    )
  }

  readonly loopPaused = signal(false);
  readonly loopActive = computed(() => !this.loopPaused());

  private readonly loopSubscribe = new Subject<void>()

  private setupLoop() {
    this.loopSubscribe.next();

    interval(3000)
      .pipe(
        filter(() => this.loopActive()),
        takeUntil(this.loopSubscribe)
      )
      .subscribe(() => this.ref()?.next('smooth', true))
  }
}
