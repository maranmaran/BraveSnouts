import { trigger, transition, state, style, animate, keyframes } from "@angular/animations";

const skipInit = trigger('skipInitAnimation', [
    transition(':enter', [])
]);

const priceOnBidChanged = trigger('priceOnBidChanged', [
    state('no-change', style({})),
    state('change', style({ color: '#0a94a7', transform: "scale(1.4)" })),
    transition('no-change <=> change', animate('225ms ease-in-out'))
]);

const starOnBidChanged = trigger('starOnBidChanged', [
    state(':enter', style({})),
    state(':leave', style({})),
    transition(':enter',
        animate('0.7s', keyframes([
            style({ opacity: 1 }),
            style({ transform: 'scale(1) translateY(0)' }),
            style({ transform: 'scale(1.1) translateY(-8px)' }),
            style({ transform: 'scale(1) translateY(0)' }),
            style({ transform: 'scale(1.05) translateY(-4px)' }),
            style({ transform: 'scale(1) translateY(0)' }),
        ])),
    )
]);

export const itemAnimations = [skipInit, priceOnBidChanged, starOnBidChanged];
