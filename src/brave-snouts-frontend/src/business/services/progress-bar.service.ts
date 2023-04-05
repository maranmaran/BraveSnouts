import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ProgressBarService {
    active$ = new BehaviorSubject<boolean>(false);
}