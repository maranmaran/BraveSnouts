import { first, map } from 'rxjs/operators';

import { Pipe, PipeTransform } from '@angular/core';
import { from } from 'rxjs';
import { CurrencyService } from '../services/currency.service';

@Pipe({
    name: 'moneyAsync'
})
export class MoneyPipe implements PipeTransform {

    constructor(private readonly currencySvc: CurrencyService) {
    }

    transform(hrk: number) {

        return from(this.currencySvc.getEurRate())
            .pipe(
                first(),
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

    constructor(private readonly currencySvc: CurrencyService) {
    }

    transform(hrk: number) {

        return from(this.currencySvc.getEurRate())
            .pipe(
                first(),
                map(eurRate => {
                    const eur = Math.round(100 * hrk / eurRate) / 100;
                    return `${eur} €`
                })
            );
    }
}

