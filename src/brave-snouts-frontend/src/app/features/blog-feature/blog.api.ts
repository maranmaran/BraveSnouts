import { Injectable, inject } from "@angular/core";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { BehaviorSubject, map, of, shareReplay, tap } from "rxjs";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    hero: string;
    content: string;
    instagram: string;
    facebook: string;
}

@Injectable({ providedIn: 'root' })
export class BlogApi {
    private readonly functions = inject(AngularFireFunctions);

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

        return this.functions.httpsCallable<void, BlogPost[]>('getBlogPosts-getBlogPostsFn')().pipe(
            tap(posts => this.postsSubject.next(posts))
        );
    }
}

