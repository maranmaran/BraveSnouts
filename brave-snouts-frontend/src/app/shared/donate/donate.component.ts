import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, Input, OnInit } from '@angular/core';
import { MediaObserver } from 'ngx-flexible-layout';
import { of } from 'rxjs';
import { fadeIn } from 'src/business/animations/fade-in.animation';
import { BankAccount, SettingsService } from 'src/business/services/settings.service';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss'],
  animations: [fadeIn],
})
export class DonateComponent implements OnInit {

  @Input() text = true;
  accounts$ = of<BankAccount[]>([]);

  constructor(
    public readonly mediaObs: MediaObserver,
    protected readonly breakpointObs: BreakpointObserver,
    private readonly settingsSvc: SettingsService
  ) { }

  ngOnInit() {
    this.accounts$ = this.settingsSvc.getAccounts();
  }
}
