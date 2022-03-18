import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { fadeIn } from 'src/business/animations/fade-in.animation';
import { SettingsService } from 'src/business/services/settings.service';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss'],
  animations: [fadeIn],
})
export class DonateComponent implements OnInit {

  @Input() text = true;

  accounts$ = this.settingsSvc.getAccounts();

  constructor(
    public readonly mediaObs: MediaObserver,
    protected readonly breakpointObs: BreakpointObserver,
    private readonly settingsSvc: SettingsService
  ) { }

  ngOnInit(): void {
  }

}
