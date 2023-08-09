import { Injectable, inject } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import firebase from 'firebase/compat/app';
import { BehaviorSubject, first, map, of, shareReplay, tap, throttleTime } from "rxjs";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    hero: string;
    content: string;
    contentJson: string;
    instagram: string;
    facebook: string;
}

@Injectable({ providedIn: 'root' })
export class BlogApi {
    private readonly store = inject(AngularFirestore);

    private readonly postsSubject = new BehaviorSubject<BlogPost[]>([]);
    readonly posts$ = this.postsSubject.asObservable().pipe(shareReplay(1));

    private readonly selectedPostSubject = new BehaviorSubject<BlogPost>(null);
    get selectedPost() { return this.selectedPostSubject.value }

    selectPost(post: BlogPost) {
        this.selectedPostSubject.next(post);
    }

    getPost(slug: string) {
        if (this.postsSubject.value.length > 0) {
            return of(this.postsSubject.value.find(x => x.slug === slug));
        }

        return this.getPosts().pipe(
            map(x => x.find(x => x.slug === slug))
        );
    }

    getPosts() {
        if (this.postsSubject.value.length > 0) {
            return this.posts$;
        }

        console.debug('called me');
        return this.store.collection<BlogPost>('blog')
            .valueChanges()
            .pipe(
                throttleTime(100),
                first(),
                map(posts => posts.map(p => ({
                    ...p,
                    date: (p.date as unknown as firebase.firestore.Timestamp).toDate()
                }))),
                tap(posts => this.postsSubject.next(posts))
            );
    }
}

