import { Injectable } from '@angular/core';
import { BehaviorSubject, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ItemScrollViewService {
  // "grid" or "items"

  block = false;

  private _view = new BehaviorSubject<string>('grid');
  view$ = this._view.asObservable().pipe(shareReplay(1));
  get view() { return this._view.value; }

  private _loading = new BehaviorSubject<boolean>(false);
  loading$ = this._loading.asObservable().pipe(shareReplay(1));

  private _show = false;
  get show() { return this._show }

  initialize() {
    this._show = true;
  }

  remove() {
    this._show = false;
    this._view.next('grid');
  }

  switchTab(tab: string) {
    this._loading.next(true);
    this._view.next(tab);
    setTimeout(() => this._loading.next(false), 50);
  }
}
