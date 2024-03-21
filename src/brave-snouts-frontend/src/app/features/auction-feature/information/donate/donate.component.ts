import { Component, Input } from '@angular/core';
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
    private readonly settingsSvc: SettingsService
  ) { }
}
