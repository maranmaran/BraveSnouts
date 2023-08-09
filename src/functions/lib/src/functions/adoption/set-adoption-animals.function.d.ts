import * as functions from 'firebase-functions';
export interface Animal {
    name: string;
    slug: string;
    description: string;
    images: string[];
    instagram: string;
    facebook: string;
}
export declare const setAdoptionAnimalsFn: functions.CloudFunction<unknown>;
