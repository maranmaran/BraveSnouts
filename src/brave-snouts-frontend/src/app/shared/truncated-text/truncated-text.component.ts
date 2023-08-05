import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TruncatePipe } from 'src/business/pipes/truncate.pipe';

@Component({
  selector: 'app-truncated-text',
  templateUrl: './truncated-text.component.html',
  styleUrls: ['./truncated-text.component.scss'],
  standalone: true,
  imports: [CommonModule, TruncatePipe],
  providers: [TruncatePipe]
})
export class TruncatedTextComponent implements OnInit, OnDestroy {

  @Input() text: string;
  @Input() characters: number = 940;
  @Input() fallbackText: string;

  showAll = false;
  subscription: Subscription;

  private readonly breakpointObs = inject(BreakpointObserver);

  ngOnInit(): void {
    this.text = this.text?.trim() == '' ? null : this.text;

    // on mobile we probably want to display less text.. (about 70% till further changes)
    this.subscription = this.breakpointObs
      .observe(Breakpoints.XSmall)
      .subscribe(() => this.characters = this.characters * 0.3)
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
