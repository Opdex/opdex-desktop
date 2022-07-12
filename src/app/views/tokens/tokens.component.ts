import { Token } from '@models/platform/token';
import { TokenFactoryService } from '@services/factory/token-factory.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'opdex-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent implements OnInit {
  tokens: Token[];

  constructor(private _tokenFactory: TokenFactoryService) { }

  async ngOnInit(): Promise<void> {
    this.tokens = await this._tokenFactory.buildTokens();
  }
}
