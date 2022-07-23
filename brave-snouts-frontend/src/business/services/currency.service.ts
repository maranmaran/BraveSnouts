import { Injectable } from "@angular/core";
import * as moment from "moment";
import { first, map } from "rxjs/operators";
import { SettingsService } from "./settings.service";

interface EurRateCache {
    eurRate: number;
    time: Date;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {

    constructor(
        private readonly settingsSvc: SettingsService
    ) {
    }

    public async getEurRate(): Promise<number> {
        const eurRateCache = JSON.parse(localStorage.getItem('eurRate')) as EurRateCache;
        if (!eurRateCache) {
            return await this.getFromDb();
        }

        const start = moment(eurRateCache.time);
        const end = moment(new Date());
        const difference = moment.duration(end.diff(start));

        if (difference.hours() >= 4) {
            return await this.getFromDb();
        }

        return eurRateCache.eurRate;
    }

    private async getFromDb() {
        const eurRate = await this.settingsSvc.settings$
            .pipe(
                first(),
                map(x => x.eurRate)
            ).toPromise();

        // preserve in local cache
        const cache = <EurRateCache>{ eurRate, time: new Date() };
        localStorage.setItem('eurRate', JSON.stringify(cache));

        return eurRate;
    }
}