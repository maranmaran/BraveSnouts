import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ItemScrollViewService {

  // "grid" or "items"
  private _view = new BehaviorSubject<string>('grid');
  public get view$() {
    return this._view.asObservable();
  }

  private _loading = new BehaviorSubject<boolean>(false);
  public get loading$() {
    return this._loading.asObservable();
  }

  private _show = false;
  public get show() {
    return this._show;
  }

  initialize() {
    this._show = true;
  }

  remove() {
    this._show = false;
  }

  switchTab(tab: string) {
    this._loading.next(true);
    this._view.next(tab);
    setTimeout(() => this._loading.next(false), 1000);
  }

}
