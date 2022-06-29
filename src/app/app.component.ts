import { ThemeService } from './services/utility/theme.service';
import { ICurrencyPricing } from './interfaces/coin-gecko.interface';
import { CoinGeckoApiService } from './services/api/coin-gecko-api.service';
import { INodeStatus } from './interfaces/full-node.interface';
import { NodeService } from './services/platform/node.service';
import { Component, HostBinding, OnInit } from '@angular/core';
import { timer, switchMap, lastValueFrom, tap } from 'rxjs';
import { db } from '@services/data/db.service';
import { PoolRepositoryService } from '@services/data/pool-repository.service';
import { TokenRepositoryService } from '@services/data/token-repository.service';
import { MarketService } from '@services/platform/market.service';
import { MiningService } from '@services/platform/mining.service';
import { PoolService } from '@services/platform/pool.service';
import { TokenService } from '@services/platform/token.service';
import { CurrencyService } from '@services/platform/currency.service';
import { RouterOutlet } from '@angular/router';
import { Icons } from '@enums/icons';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FadeAnimation } from '@animations/fade-animation';

@Component({
  selector: 'opdex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [FadeAnimation]
})
export class AppComponent implements OnInit {
  @HostBinding('class') componentCssClass: string;
  nodeStatus: INodeStatus;
  indexing: boolean;
  prices: ICurrencyPricing;
  theme: string;
  icons = Icons;
  menuOpen = false;
  isPinned = true;

  constructor(
    public overlayContainer: OverlayContainer,
    private _nodeService: NodeService,
    private _marketService: MarketService,
    private _poolsService: PoolService,
    private _poolsRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _tokenRepository: TokenRepositoryService,
    private _miningService: MiningService,
    private _coinGecko: CoinGeckoApiService,
    private _currencyService: CurrencyService,
    private _themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this._themeService.getTheme().subscribe(theme => this.setTheme(theme));

    timer(0, 60000)
      .pipe(
        switchMap(_ => this._coinGecko.getLatestPrice()),
        tap(pricing => this._currencyService.setPricing(pricing.stratis)),
        switchMap(_ => this._currencyService.prices$)
      )
      .subscribe(prices => this.prices = prices)

    timer(0, 30000)
      .pipe(
        switchMap(_ => this._nodeService.refreshStatus$())
      )
      .subscribe(status => {
        this.nodeStatus = status;
        if (status.inIbd) {
          // Todo: node is syncing, wait
          return;
        }

        // Todo: Watch each new block on timer or signalR
        // Todo: Index primary data periodically
        // --- OnInit - if indexing, show loader
      });

    this._nodeService.latestBlock$
      .subscribe(async status => {
        await this._indexLatest();
      });
  }

  private async _indexLatest() {
    if (this.indexing) return;

    this.indexing = true;

    const indexer = await db.indexer.get(1);
    const nodeStatus = this._nodeService.status;

    const [pools, rewardedMiningPools, nominations] = await Promise.all([
      lastValueFrom(this._marketService.getMarketPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getRewardedPools(indexer?.lastUpdateBlock)),
      lastValueFrom(this._miningService.getNominatedPools())
    ]);

    const poolsDetails = await Promise.all(pools.map(async pool => {
      const poolDetails = await lastValueFrom(this._poolsService.getStaticPool(pool.pool));
      const tokenDetails = await lastValueFrom(this._tokenService.getToken(pool.token));

      const poolResponse = {
        pool: poolDetails,
        token: tokenDetails
      };

      return poolResponse;
    }));

    if (poolsDetails.length) {
      await this._poolsRepository.persistPools(poolsDetails.map(({pool, token}) => {
        return {
          address: pool.address,
          name: `${token.symbol}-${nodeStatus.coinTicker}`,
          srcToken: token.address,
          miningPool: pool.miningPool,
          transactionFee: pool.transactionFee
        }
      }));

      await this._tokenRepository.persistTokens(poolsDetails.map(({ token }) => {
        const decimals = parseInt(token.decimals);

        console.log(token.nativeChain, token.nativeAddress);

        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: decimals,
          nativeChain: token.nativeChain || 'Cirrus',
          nativeChainAddress: token.nativeChainAddress
        }
      }));
    }

    // Todo: Persist active mining pools
    console.log(rewardedMiningPools);

    // Todo: Persist nominations
    console.log(nominations);

    // Todo: Refresh vault proposals

    db.indexer.put({
      lastUpdateBlock: nodeStatus.blockStoreHeight,
      id: 1
    });

    this.indexing = false;
  }

  public handlePinnedToggle(event: boolean): void {
    this.isPinned = event;
  }

  public handleRouteChanged(url: string): void {
    // dont care about the url just close the menu
    this.menuOpen = false;
  }

  public handleToggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  public prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  private setTheme(theme: string): void {
    if (theme === this.theme) return;

    const overlayClassList = this.overlayContainer.getContainerElement().classList;
    overlayClassList.add(theme);
    overlayClassList.remove(this.theme);

    document.documentElement.classList.add(theme);
    document.documentElement.classList.remove(this.theme);

    this.componentCssClass = `${theme} root`;
    this.theme = theme;

    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    metaThemeColor.setAttribute("content", this.theme === 'light-mode' ? '#ffffff' : '#1b192f');
  }
}
