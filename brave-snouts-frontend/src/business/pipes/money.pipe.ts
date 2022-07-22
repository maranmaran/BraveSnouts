import { first, map } from 'rxjs/operators';
import { SettingsService } from 'src/business/services/settings.service';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'moneyAsync'
})
export class MoneyPipe implements PipeTransform {

    constructor(private readonly settingsSvc: SettingsService) {
    }

    transform(hrk: number) {

        return this.settingsSvc.settings$
            .pipe(
                first(),
                map(x => x.eur),
                map(eurRate => {
                    const eur = Math.round(100 * hrk / eurRate) / 100;
                    return `${hrk} kn | ${eur} €`
                })
            );
    }
}


@Pipe({
    name: 'eurAsync'
})
export class EurPipe implements PipeTransform {

    constructor(private readonly settingsSvc: SettingsService) {
    }

    transform(hrk: number) {

        return this.settingsSvc.settings$
            .pipe(
                first(),
                map(x => x.eur),
                map(eurRate => {
                    const eur = Math.round(100 * hrk / eurRate) / 100;
                    return `${eur} €`
                })
            );
    }
}

