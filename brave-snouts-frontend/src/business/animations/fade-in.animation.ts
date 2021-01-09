import { animate, query, state, style, transition, trigger } from "@angular/animations";

// Trigger animation cards array
export const fadeIn = trigger('fadeIn', [
    transition(':enter', [
        style({ opacity: 0  }),
        animate('0.5s ease-in', style({ opacity: 1 }))
    ])
])