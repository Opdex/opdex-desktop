import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { WalletService } from '@services/platform/wallet.service';
import { IndexerService } from '@services/platform/indexer.service';
import { TransactionView } from '@enums/transaction-view';
import { TokenService } from '@services/platform/token.service';
import { Subscription, tap, switchMap } from 'rxjs';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Icons } from '@enums/icons';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-token',
  templateUrl: './token.component.html',
  styleUrls: ['./token.component.scss']
})
export class TokenComponent implements OnInit, OnDestroy {
  token: Token;
  pool: LiquidityPool;
  icons = Icons;
  one = FixedDecimal.One(0);
  crsPerOlpt: FixedDecimal;
  srcPerOlpt: FixedDecimal;
  latestBlock: number;
  context: UserContext;
  userBalance: FixedDecimal;
  subscription = new Subscription();
  routerSubscription = new Subscription();

  constructor(
    private _route: ActivatedRoute,
    private _liquidityPoolService: LiquidityPoolService,
    private _indexerService: IndexerService,
    private _tokenService: TokenService,
    private _router: Router,
    private _walletService: WalletService,
    private _userContextService: UserContextService
  ) { }

  async ngOnInit(): Promise<void> {
    this.init();

    this.routerSubscription.add(
      this._router.events.subscribe((evt) => {
        if (!(evt instanceof NavigationEnd)) return;
        this.init();
      })
    );
  }

  async init(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');

    if (!this.subscription.closed) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }

    this.subscription.add(
      this._indexerService.latestBlock$
        .pipe(
          tap(latestBlock => this.latestBlock = latestBlock),
          switchMap(_ => this._setPoolAndToken(address)),
          switchMap(_ => this._checkUserBalance()))
        .subscribe());
  }

  handleTxOption(option: TransactionView) {
    this._router.navigate(['/trade'], { queryParams: {view: option, pool: this.pool?.address}})
  }

  private async _checkUserBalance(): Promise<void> {
    if (!this.token) return;

    const context = this._userContextService.userContext;

    if (!context.isLoggedIn) {
      this.context = undefined;
      this.userBalance = undefined;
      return;
    }

    const balance = await this._walletService.getBalance(this.token.address, context.wallet.address);

    this.context = context;
    this.userBalance = FixedDecimal.FromBigInt(balance, this.token.decimals);
  }

  private async _setPoolAndToken(address: string): Promise<void> {
    if (address !== 'CRS') {
      // SRC token first, fallback if not found to OLPT
      this.pool = await this._liquidityPoolService.getLiquidityPoolBySrcToken(address) ||
                  await this._liquidityPoolService.getLiquidityPool(address);

      // Todo: If no pool is found, display an error

      const isOLPT = address === this.pool.lpToken.address;

      if (isOLPT) {
        this.token = this.pool.lpToken;

        const { lpToken, reserveCrs, reserveSrc } = this.pool;

        this.crsPerOlpt = reserveCrs.divide(lpToken.totalSupply);
        this.srcPerOlpt = reserveSrc.divide(lpToken.totalSupply);
      } else {
        this.token = this.pool.srcToken;
      }

      this.token = address === this.pool.srcToken.address ? this.pool.srcToken : this.pool.lpToken;
    } else {
      this.token = await this._tokenService.getToken('CRS');
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }
}
