import { IndexerService } from '@services/platform/indexer.service';
import { TokenService } from '@services/platform/token.service';
import { WalletService } from '@services/platform/wallet.service';
import { Subscription, switchMap, tap } from 'rxjs';
import { Icons } from 'src/app/enums/icons';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AllowanceValidation } from '@models/allowance-validation';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ReviewQuoteComponent } from '../review-quote/review-quote.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'opdex-allowance-validation',
  templateUrl: './allowance-validation.component.html',
  styleUrls: ['./allowance-validation.component.scss']
})
export class AllowanceValidationComponent implements OnChanges, OnDestroy {
  @Input() allowance: AllowanceValidation;
  ignore: boolean = true;
  waiting: boolean;
  icons = Icons;
  subscription: Subscription;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _indexerService: IndexerService,
    private _walletService: WalletService,
    private _tokenService: TokenService
  ) { }

  ngOnChanges() {
    if (!!this.allowance) {
      if (this.allowance.isApproved) this.waiting = false;

      if (!this.subscription) {
        this.subscription = new Subscription();

        this.subscription.add(
          this._indexerService.latestBlock$
            .pipe(
              switchMap(_ => this._walletService.getAllowance(this.allowance.token.address, this.allowance.owner, this.allowance.spender)),
              tap(allowance => this.allowance.update(allowance)))
            .subscribe(_ => {
              if (this.allowance.isApproved) this.waiting = false;
            }));
      }
    }
  }

  async approveAllowance() {
    if (!this.allowance) return;

    const { token, spender, allowance, requestToSpend } = this.allowance;
    const quote = await this._tokenService.allowanceApprovalQuote(token.address, spender, allowance, requestToSpend);

    this.waiting = true;

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote })
      .afterDismissed()
      .pipe(take(1))
      .subscribe((txHash: string) => {
        if (!txHash) this.waiting = false;
      });
  }

  setIgnore(value: boolean) {
    this.ignore = value;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
