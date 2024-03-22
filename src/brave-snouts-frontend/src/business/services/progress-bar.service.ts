import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ProgressBarService {
    loading$ = new BehaviorSubject<boolean>(false);
}