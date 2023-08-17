import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auction-rules',
  templateUrl: './auction-rules.component.html',
  styles: [
    `
    .container {
      h2 {
          margin-top: 2rem;
          margin-bottom: 1rem !important;
          font-weight: bold;
      }
    }

    @media(max-width: 1200px) {
        .container {
            margin-top: 2rem;

            >h1 {
                text-align: center;
            }
        }
    }`
  ]
})
export class AuctionRulesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
