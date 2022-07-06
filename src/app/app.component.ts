import { IndexerService } from './services/platform/indexer.service';
import { ThemeService } from './services/utility/theme.service';
import { ICurrencyPricing } from './interfaces/coin-gecko.interface';
import { CoinGeckoApiService } from './services/api/coin-gecko-api.service';
import { INodeStatus } from './interfaces/full-node.interface';
import { NodeService } from './services/platform/node.service';
import { Component, HostBinding, OnInit } from '@angular/core';
import { timer, switchMap, tap } from 'rxjs';
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
  prices: ICurrencyPricing;
  theme: string;
  icons = Icons;
  menuOpen = false;
  isPinned = true;

  constructor(
    public overlayContainer: OverlayContainer,
    private _nodeService: NodeService,
    private _coinGecko: CoinGeckoApiService,
    private _currencyService: CurrencyService,
    private _themeService: ThemeService,
    private _indexerService: IndexerService
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

    timer(0, 10000)
      .pipe(
        switchMap(_ => this._nodeService.refreshStatus$())
      )
      .subscribe(status => {
        this.nodeStatus = status;

        // Node is not finished starting
        if (status?.state !== 'Started') {
          return;
        }

        // Todo: node is syncing, wait
        if (status?.inIbd) {
          return;
        }
      });

    this._nodeService.latestBlock$
      .subscribe(async block => {
        // Todo: If initial index - show loader (it can take a while)
        await this._indexerService.index();
      });
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
