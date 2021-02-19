import { animate, keyframes, state, style, transition, trigger } from "@angular/animations";

export const raisedMoneyAnimation = trigger('raisedMoneyAnimation', [
  state('notRaised', style({})),
  state('raised', style({})),
  transition('notRaised => raised',
      animate('0.7s', keyframes([
          style({ transform: 'scale(1.25)' }),
          style({ transform: 'scale(1.5)' }),
          style({ transform: 'scale(1.25)' }),
          style({ transform: 'scale(1)' }),
      ])),
  )
]);
