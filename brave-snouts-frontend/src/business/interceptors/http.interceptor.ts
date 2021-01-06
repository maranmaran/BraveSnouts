import { HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { ProgressBarService } from "src/business/services/progress-bar.service";

@Injectable()
export class HttpInterceptor implements HttpInterceptor {

    constructor(
        private loadingSvc: ProgressBarService,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        this.loadingSvc.active$.next(true);

        return next.handle(req)
            .pipe(
                finalize(() => this.loadingSvc.active$.next(false))
            );
    }
}