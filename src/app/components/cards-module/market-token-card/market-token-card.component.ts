import { Component, Input } from '@angular/core';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-market-token-card',
  templateUrl: './market-token-card.component.html',
  styleUrls: ['./market-token-card.component.scss']
})
export class MarketTokenCardComponent {
  @Input() token: Token;
}
