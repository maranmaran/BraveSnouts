import { Injectable } from "@angular/core";
import { Asset, Entry, EntrySkeletonType, createClient } from 'contentful';
import { BehaviorSubject, first, from, map, mergeMap, of, shareReplay, tap, toArray } from "rxjs";
import { environment } from "src/environments/environment";

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
    private readonly content_type = 'braveSnoutsAdoption';
    private readonly client = createClient({
        space: environment.contentful.space,
        accessToken: environment.contentful.apiKey,
    });

    constructor() {
    }

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

        const call = this.client.getEntries({ content_type: this.content_type });

        return from(call)
            .pipe(
                first(),
                map(x => x.items.map(this.toBlogPost)),
                mergeMap(posts => of(...posts)),
                toArray(),
                map(animals => animals.sort((a, b) => a.name < b.name ? 1 : -1)),
                tap(animals => this.animalsSubject.next(animals))
            );
    }

    private toBlogPost(entry: Entry<EntrySkeletonType, undefined, string>) {
        return <Animal>{
            name: entry.fields.name,
            slug: entry.fields.slug,
            description: entry.fields.description,
            images: (<Asset[]>entry.fields.images).map(x => x.fields.file.url),
            instagram: entry.fields.instagram,
            facebook: entry.fields.facebook,
        };
    }

}

