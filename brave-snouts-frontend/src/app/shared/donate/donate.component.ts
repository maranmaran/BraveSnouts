import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss']
})
export class DonateComponent implements OnInit {

  constructor(
    public readonly mediaObs: MediaObserver,
    protected readonly breakpointObs: BreakpointObserver
  ) { }

  ngOnInit(): void {
  }

}
