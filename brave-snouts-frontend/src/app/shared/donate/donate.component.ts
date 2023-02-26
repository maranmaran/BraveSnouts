import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import { MediaObserver } from 'ngx-flexible-layout';
import { fadeIn } from 'src/business/animations/fade-in.animation';
import { SettingsService } from 'src/business/services/settings.service';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss'],
  animations: [fadeIn],
})
export class DonateComponent {

  @Input() text = true;
  accounts$ = this.settingsSvc.getAccounts()

  constructor(
    private readonly settingsSvc: SettingsService,
    protected readonly mediaObs: MediaObserver,
    protected readonly breakpointObs: BreakpointObserver,
  ) { }
}
