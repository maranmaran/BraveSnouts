import * as functions from 'firebase-functions';
export interface BlogPost {
    title: string;
    slug: string;
    date: Date;
    tags: string[];
    description: string;
    hero: string;
    content: string;
    instagram: string;
    facebook: string;
}
export declare const setBlogPostsFn: functions.CloudFunction<unknown>;
