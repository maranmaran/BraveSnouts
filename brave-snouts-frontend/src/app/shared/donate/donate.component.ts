import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { fadeIn } from 'src/business/animations/fade-in.animation';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss'],  
  animations: [ fadeIn ],
})
export class DonateComponent implements OnInit {

  @Input() text = true;
  
  constructor(
    public readonly mediaObs: MediaObserver,
    protected readonly breakpointObs: BreakpointObserver
  ) { }

  ngOnInit(): void {
  }

}
