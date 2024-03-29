import { Injectable, inject } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import firebase from 'firebase/compat/app';
import { BehaviorSubject, first, map, of, shareReplay, tap } from "rxjs";
import { FirebaseFile } from "src/business/models/firebase-file.model";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    hero: FirebaseFile;
    content: string;
    instagram: string;
    facebook: string;
}

@Injectable({ providedIn: 'root' })
export class BlogApi {
    private readonly store = inject(AngularFirestore);

    private readonly postsSubject = new BehaviorSubject<BlogPost[]>([]);
    readonly posts$ = this.postsSubject.asObservable().pipe(shareReplay(1));

    private readonly selectedPostSubject = new BehaviorSubject<BlogPost>(null);
    readonly selectedPost$ = this.selectedPostSubject.asObservable().pipe(shareReplay(1));
    get selectedPost() { return this.selectedPostSubject.value }

    selectPost(post: BlogPost) {
        this.selectedPostSubject.next(post);
    }

    getPost(slug: string) {
        if (this.postsSubject.value.length > 0) {
            return of(this.postsSubject.value.find(x => x.slug === slug));
        }

        return this.posts$.pipe(
            map(x => x.find(x => x.slug === slug))
        );
    }

    getPosts() {
        if (this.postsSubject.value.length > 0) {
            return this.posts$;
        }

        return this.store.collection<BlogPost>('blog')
            .valueChanges()
            .pipe(
                first(),
                map(posts => posts.map(p => ({
                    ...p,
                    date: (p.date as unknown as firebase.firestore.Timestamp).toDate()
                }))),
                tap(posts => this.postsSubject.next(posts))
            );
    }
}

