import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Injectable, inject } from "@angular/core";
import { map, shareReplay, tap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class BreakpointService {
    private readonly breakpointObs = inject(BreakpointObserver)

    isMobile$ = this.breakpointObs.observe(Breakpoints.HandsetPortrait).pipe(
        map(x => x.matches),
        tap(console.log),
        shareReplay(1)
    )
}