import { Injectable, inject } from "@angular/core";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { BehaviorSubject, map, of, shareReplay, tap } from "rxjs";

export interface Animal {
    name: string;
    slug: string;
    description: string,
    images: string[];
    instagram: string;
    facebook: string;
}

@Injectable({ providedIn: 'root' })
export class AdoptApi {
    private readonly functions = inject(AngularFireFunctions);

    private readonly animalsSubject = new BehaviorSubject<Animal[]>([]);
    readonly animals$ = this.animalsSubject.asObservable().pipe(shareReplay(1));

    private readonly selectedAnimalSubject = new BehaviorSubject<Animal>(null);
    readonly selectedAnimal$ = this.selectedAnimalSubject.asObservable().pipe(shareReplay(1));
    get selectedAnimal() { return this.selectedAnimalSubject.value }

    selectAnimal(post: Animal) {
        this.selectedAnimalSubject.next(post);
    }

    getAnimal(slug: string) {
        if (this.animalsSubject.value.length > 0) {
            return of(this.animalsSubject.value.find(x => x.slug === slug));
        }

        return this.getAnimals().pipe(
            map(x => x.find(x => x.slug === slug))
        );
    }

    getAnimals() {
        if (this.animalsSubject.value.length > 0) {
            return this.animals$;
        }

        return this.functions.httpsCallable<void, Animal[]>('getAdoptAnimals-getAdoptAnimalsFn')().pipe(
            tap(animals => this.animalsSubject.next(animals))
        );
    }
}

