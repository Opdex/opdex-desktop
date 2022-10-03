import { LoggerService } from './services/utility/logger.service';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { EnvironmentsService } from '@services/utility/environments.service';
import { IndexerService } from './services/platform/indexer.service';
import { ThemeService } from './services/utility/theme.service';
import { CoinGeckoApiService } from './services/api/coin-gecko-api.service';
import { INodeStatus } from './interfaces/full-node.interface';
import { NodeService } from './services/platform/node.service';
import { Component, HostBinding, OnInit } from '@angular/core';
import { timer, switchMap, tap, filter, firstValueFrom, catchError, of } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { RouterOutlet } from '@angular/router';
import { Icons } from '@enums/icons';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FadeAnimation } from '@animations/fade-animation';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { GitHubApiService } from '@services/api/github-api.service';

@Component({
  selector: 'opdex-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [FadeAnimation]
})
export class AppComponent implements OnInit {
  @HostBinding('class') componentCssClass: string;
  nodeStatus: INodeStatus;
  selectedCurrency: ICurrency;
  indexedBlock: number;
  indexedPercent: number = this._env.startHeight;
  theme: string;
  icons = Icons;
  menuOpen = false;
  isPinned = true;
  hasIndexed = false;
  appUpdateUrl: string;
  nodeUpdate: boolean;

  constructor(
    public overlayContainer: OverlayContainer,
    private _cirrusApi: CirrusApiService,
    private _nodeService: NodeService,
    private _coinGecko: CoinGeckoApiService,
    private _currencyService: CurrencyService,
    private _themeService: ThemeService,
    private _indexerService: IndexerService,
    private _env: EnvironmentsService,
    private _githubApi: GitHubApiService,
    private _logger: LoggerService
  ) { }

  async ngOnInit(): Promise<void> {
    this.nodeStatus = await this._refreshNodeStatus();
    this._themeService.getTheme().subscribe(theme => this.setTheme(theme));
    this._indexerService.hasIndexed.subscribe(hasIndexed => this.hasIndexed = hasIndexed);
    this._indexerService.latestBlock$.subscribe(block => {
      this.indexedBlock = block;
      if (this.nodeStatus?.blockStoreHeight) {
        this.indexedPercent = block / this.nodeStatus.blockStoreHeight * 100
      }
    });

    timer(0, 60000)
      .pipe(
        switchMap(_ => this._coinGecko.getLatestPrice()),
        tap(pricing => this._currencyService.setPricing(pricing.stratis)),
        switchMap(_ => this._currencyService.selectedCurrency$))
      .subscribe(async currency => {
        this.selectedCurrency = currency;
        await this._checkAppUpdate();
      });

    // intentionally offset 10 seconds
    timer(10000, 10000)
      .pipe(switchMap(_ => this._refreshNodeStatus()))
      .subscribe(status => {
        this.nodeStatus = status
        this._checkNodeVersion();
      });

    this._nodeService.latestBlock$
      .pipe(filter(_ => !!this.nodeStatus && this.nodeStatus.state === 'Started' && !this.nodeStatus.inIbd && !this._indexerService.indexing))
      .subscribe(async _ => await this._indexLatest());
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

  private async _indexLatest(): Promise<void> {
    try {
      await this._indexerService.index();
    } catch (error) {
      // Log and re-index all data on failure
      this._logger.error(error);
      await this._indexerService.index(true);
    }
  }

  private async _checkAppUpdate(): Promise<void> {
    const latestVersion = await firstValueFrom(this._githubApi.getLatestVersion());
    if (latestVersion && this._env.version.compare(latestVersion.tag_name) === -1) {
      this.appUpdateUrl = latestVersion.html_url;
    }
  }

  private _checkNodeVersion(): void {
    const { status } = this._nodeService;
    if (!status) return;

    // Adjust version patch (ex: 1.3.2.0 to 1.3.2)
    const currentVersion = status.version.split('.').slice(0, 3).join('.');
    this.nodeUpdate = this._env.minNodeVersion.compare(currentVersion) === 1;
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

  private async _refreshNodeStatus(): Promise<INodeStatus> {
    const status = await firstValueFrom(this._cirrusApi.getNodeStatus().pipe(catchError(_ => of(undefined))));
    this._nodeService.setStatus(status);
    return status;
  }
}
