import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Injectable, inject } from "@angular/core";
import { map, shareReplay } from "rxjs";

@Injectable({ providedIn: 'root' })
export class BreakpointService {
    private readonly breakpointObs = inject(BreakpointObserver)

    isMobile$ = this.breakpointObs.observe(Breakpoints.HandsetPortrait).pipe(
        map(x => x.matches),
        shareReplay(1)
    )
}