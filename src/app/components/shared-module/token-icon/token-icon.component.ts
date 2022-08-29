import { Component, Input } from '@angular/core';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-token-icon',
  templateUrl: './token-icon.component.html',
  styleUrls: ['./token-icon.component.scss']
})
export class TokenIconComponent {
  private readonly _baseUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

  @Input() token: Token;
  @Input() large: boolean;

  public get iconPath(): string {
    if (!this.token) return '';

    let { wrappedToken } = this.token;

    if (!!wrappedToken === false) return '';

    const { chain, address } = wrappedToken;

    return !!address
      ? `${this._baseUrl}/${chain.toLowerCase()}/assets/${address}/logo.png`
      : `${this._baseUrl}/${chain.toLowerCase()}/info/logo.png`;
  }

  public get backgroundImage(): string {
    if (!this.token) return '';
    if (this.token.isCrs) return 'url(assets/tokens/crs.png)';
    else if (this.token.isStaking) return 'url(assets/tokens/odx.png)';
    else return `url(${this.iconPath}), url(assets/tokens/missing.png)`;
  }
}
