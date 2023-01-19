
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'moneyAsync'
})
export class MoneyPipe implements PipeTransform {
    transform(eur: number) {
        return `${eur} €`
    }
}
