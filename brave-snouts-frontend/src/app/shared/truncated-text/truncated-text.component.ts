import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-truncated-text',
  templateUrl: './truncated-text.component.html',
  styleUrls: ['./truncated-text.component.scss']
})
export class TruncatedTextComponent implements OnInit, OnDestroy {

  @Input() text: string;
  @Input() characters: number = 940;
  @Input() fallbackText: string;

  showAll = false;

  constructor(
    private mediaObserver: MediaObserver
  ) { }

  subscription: Subscription;

  ngOnInit(): void {
    this.text = this.text?.trim() == '' ? null : this.text;

    // on mobile we probably want to display less text.. (about 70% till further changes)
    this.subscription = this.mediaObserver.asObservable().subscribe(
      media => {
        media.forEach(change => {
          if (change.mqAlias == 'xs')
            this.characters = this.characters * 0.3;
        })
      }
    ),
      err => console.log(err)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
