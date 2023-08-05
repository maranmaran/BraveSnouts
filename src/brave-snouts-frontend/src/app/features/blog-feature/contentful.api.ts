import { Injectable } from "@angular/core";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { Entry, EntrySkeletonType, createClient } from 'contentful';
import { BehaviorSubject, first, from, map, mergeMap, of, shareReplay, tap, toArray } from "rxjs";
import { environment } from "src/environments/environment";

export interface BlogPost {
    title: string;
    slug: string;
    date: Date,
    tags: string[],
    description: string,
    heroImage: string,
    content: string;
}

@Injectable()
export class ContentfulApiService {
    private readonly content_type = 'braveSnoutsBlog';
    private readonly client = createClient({
        space: environment.contentful.space,
        accessToken: environment.contentful.apiKey,
    });

    constructor() {
    }

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
        const call = this.client.getEntries({ content_type: this.content_type });

        return from(call)
            .pipe(
                first(),
                map(x => x.items.map(this.toBlogPost)),
                mergeMap(posts => of(...posts)),
                mergeMap(post => this.getAsset(post.heroImage)
                    .pipe(map(r => ({ post, r })))
                ),
                map(({ post, r }) => (post.heroImage = r.fields.file.url, post)),
                toArray(),
                map(posts => posts.sort((a, b) => a.date < b.date ? 1 : -1)),
                tap(posts => this.postsSubject.next(posts))
            );
    }

    getAsset(id: string) {
        const call = this.client.getAsset(id);
        return from(call).pipe(first());
    }

    private toBlogPost(entry: Entry<EntrySkeletonType, undefined, string>) {
        return <BlogPost>{
            title: entry.fields.title,
            slug: entry.fields.slug,
            date: new Date(entry.fields.date as string),
            tags: entry.metadata.tags.map(x => x.sys.id),
            description: entry.fields.description,
            heroImage: (entry.fields.heroImage as any).sys.id,
            content: documentToHtmlString(entry.fields.content as any),
        };
    }

}

