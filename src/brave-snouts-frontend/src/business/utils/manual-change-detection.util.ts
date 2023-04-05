import { ApplicationRef, ChangeDetectorRef } from '@angular/core';

// note: this portion is only needed if you don't already have a debounce implementation in your app
export class Util {
    public static throttleTrailing(func: Function, wait: number): Function {
        let timeout = undefined;
        let _arguments = undefined;
        const result = function () {
            const _this = this;
            _arguments = arguments;

            if (timeout) {
                return;
            }

            if (wait <= 0) {
                func.apply(_this, _arguments);
            } else {
                timeout = setTimeout(function () {
                    timeout = undefined;
                    func.apply(_this, _arguments);
                }, wait);
            }
        };
        result['cancel'] = function () {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        };

        return result;
    }

    public static debounce(func: Function, wait: number): Function {
        const throttled = Util.throttleTrailing(func, wait);
        const result = function () {
            throttled['cancel']();
            throttled.apply(this, arguments);
        };
        result['cancel'] = function () {
            throttled['cancel']();
        };

        return result;
    }
}

/**
 * In order to make virtual scrolling supafast use this guide
 * https://github.com/rintoj/ngx-virtual-scroller/blob/master/README.md
 * Make everything OnPush underneat the virtual scroll
 */
export class ManualChangeDetection {

    constructor(private changeDetectorRef: ChangeDetectorRef) {
    }

    public queueChangeDetection(): void {
        // marks self for change detection on the next cycle, but doesn't actually schedule a cycle
        this.changeDetectorRef.markForCheck();
        this.queueApplicationTick();
    }

    public static STATIC_APPLICATION_REF: ApplicationRef;
    public queueApplicationTick = Util.debounce(() => {
        if (ManualChangeDetection.STATIC_APPLICATION_REF['_runningTick']) {
            return;
        }

        ManualChangeDetection.STATIC_APPLICATION_REF.tick();
    }, 5);

}
