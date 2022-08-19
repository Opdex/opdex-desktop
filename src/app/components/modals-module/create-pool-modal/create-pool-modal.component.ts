import { Router } from '@angular/router';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Subscription } from 'rxjs';
import { UserContext } from '@models/user-context';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MarketService } from '@services/platform/market.service';
import { Icons } from 'src/app/enums/icons';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { TokenService } from '@services/platform/token.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Token } from '@models/platform/token';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'opdex-create-pool-modal',
  templateUrl: './create-pool-modal.component.html',
  styleUrls: ['./create-pool-modal.component.scss']
})
export class CreatePoolModalComponent implements OnInit, OnDestroy {
  tokenControl = new FormControl('');
  validatedToken: Token;
  validatedTokenPool: LiquidityPool;
  validationError: string;
  icons = Icons;
  context: UserContext;
  subscription = new Subscription();

  get isTokenValid(): boolean {
    return !!this.validatedToken && !this.validatedTokenPool;
  }

  constructor(
    private _userContextService: UserContextService,
    private _tokenService: TokenService,
    private _liquidityPoolService: LiquidityPoolService,
    private _marketService: MarketService,
    private _bottomSheet: MatBottomSheet,
    public dialogRef: MatDialogRef<CreatePoolModalComponent>,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  async validateToken(): Promise<void> {
    this.validationError = undefined;

    try {
      const token = await this._tokenService.getToken(this.tokenControl.value);
      // Check that the token provided is not OLPT and that the SRC token doesn't already have a pool
      const pool = await this._liquidityPoolService.getLiquidityPool(this.tokenControl.value) ||
                                await this._liquidityPoolService.getLiquidityPoolBySrcToken(this.tokenControl.value);

      this.validatedToken = token;
      this.validatedTokenPool = pool;
      this.tokenControl.disable();
    } catch {
      this.validationError = 'Invalid token address supplied.';
    }
  }

  async createPool(): Promise<void> {
    if (this.validationError || !this.context.isLoggedIn) return;

    const quote = await this._marketService.createLiquidityPoolQuote(this.validatedToken.address);

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  viewPool(): void {
    this.dialogRef.close();
    this._router.navigateByUrl(`pools/${this.validatedTokenPool.address}`);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
