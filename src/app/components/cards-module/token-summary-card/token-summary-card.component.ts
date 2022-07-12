import { NodeService } from '@services/platform/node.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { Component, Input, OnDestroy } from '@angular/core';
import { Token } from '@models/platform/token';

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

  constructor(
    private _indexService: NodeService,
    private _userContextService: UserContextService,
    private _bottomSheet: MatBottomSheet
  ) {
    this.subscription.add(
      this._indexService.latestBlock$
        .subscribe(block => this.latestBlock = block));

    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  distribute(): void {
    // if (!this.context?.wallet || !this.token) return;

    // this._platformApiService.distributeTokensQuote(this.token.address)
    //   .pipe(take(1))
    //   .subscribe((quote: ITransactionQuote) => this._bottomSheet.open(ReviewQuoteComponent, { data: quote }),
    //              (error: OpdexHttpError) => this.quoteErrors = error.errors);
  }


  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
