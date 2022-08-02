import { Icons } from 'src/app/enums/icons';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { TokenService } from '@services/platform/token.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Token } from '@angular/compiler';

@Component({
  selector: 'opdex-create-pool-modal',
  templateUrl: './create-pool-modal.component.html',
  styleUrls: ['./create-pool-modal.component.scss']
})
export class CreatePoolModalComponent implements OnInit {
  tokenControl = new FormControl('');
  validatedToken: Token;
  icons = Icons;

  constructor(
    private _userContextService: UserContextService,
    private _tokenService: TokenService,
    private _liquidityPoolService: LiquidityPoolService
  ) { }

  ngOnInit(): void {

  }

  async validateToken(): Promise<void> {
    const token = await this._tokenService.buildToken(this.tokenControl.value);
    console.log(token);
  }
}
