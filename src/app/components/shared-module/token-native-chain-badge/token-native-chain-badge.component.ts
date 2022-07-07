import { WrappedToken } from '@models/platform/token';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'opdex-token-native-chain-badge',
  templateUrl: './token-native-chain-badge.component.html',
  styleUrls: ['./token-native-chain-badge.component.scss']
})
export class TokenNativeChainBadgeComponent {
  @Input() wrappedToken: WrappedToken;
}
