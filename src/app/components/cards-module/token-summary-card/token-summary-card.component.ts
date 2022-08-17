import { TokenService } from '@services/platform/token.service';
import { ICurrency } from '@lookups/currencyDetails.lookup';
import { CurrencyService } from '@services/platform/currency.service';
import { NodeService } from '@services/platform/node.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { Icons } from 'src/app/enums/icons';
import { Subscription, tap } from 'rxjs';
import { Component, Input, OnDestroy } from '@angular/core';
import { Token } from '@models/platform/token';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';

@Component({
  selector: 'opdex-token-summary-card',
  templateUrl: './token-summary-card.component.html',
  styleUrls: ['./token-summary-card.component.scss']
})
export class TokenSummaryCardComponent implements OnDestroy {
  @Input() token: Token;
  @Input() showTokenName: boolean;
  latestBlock: number;
  context: UserContext;
  quoteErrors: string[];
  subscription = new Subscription();
  icons = Icons;
  currency: ICurrency;

  constructor(
    private _indexService: NodeService,
    private _userContextService: UserContextService,
    private _bottomSheet: MatBottomSheet,
    private _currency: CurrencyService,
    private _tokenService: TokenService
  ) {
    this.subscription.add(
      this._indexService.latestBlock$
        .subscribe(block => this.latestBlock = block));

    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));

    this.subscription.add(
      this._currency.selectedCurrency$
        .pipe(tap(currency => this.currency = currency))
        .subscribe());
  }

  async distribute(): Promise<void> {
    if (!this.context?.isLoggedIn || !this.token) return;

    const quote = await this._tokenService.distributionQuote();

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
