import { trigger, transition, query, style, stagger, animate, keyframes } from "@angular/animations";

 // Trigger animation cards array
 export const staggerFadeIn = trigger('staggerFadeIn', [
    // Transition from any state to any state
    transition('* => *', [
      // Initially the all cards are not visible
      query(':enter', style({ opacity: 0 }), { optional: true }),

      // Each card will appear sequentially with the delay of 300ms
      query(':enter', stagger('120ms', [
        animate('10s ease-in', keyframes([
          style({ opacity: 1, transform: 'translateY(50%)' }),
          style({ opacity: 1, transform: 'translateY(25%)' }),
          style({ opacity: 1, transform: 'translateY(0)' }),
        ]))]), { optional: true }),

      // Cards will disappear sequentially with the delay of 300ms
      // query(':leave', stagger('300ms', [
      //   animate('500ms ease-out', keyframes([
      //     style({ opacity: 1, transform: 'scale(1.1)', offset: 0 }),
      //     style({ opacity: .5, transform: 'scale(.5)', offset: 0.3 }),
      //     style({ opacity: 0, transform: 'scale(0)', offset: 1 }),
      //   ]))]), { optional: true })
    ]),
  ])