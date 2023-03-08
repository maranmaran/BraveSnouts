
import { Pipe, PipeTransform } from '@angular/core';
import { of } from 'rxjs';

@Pipe({
    name: 'moneyAsync'
})
export class MoneyPipe implements PipeTransform {
    transform(eur: number) {
        return of(`${eur} €`)
    }
}
