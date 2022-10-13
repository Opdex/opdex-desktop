import { Icons } from '@enums/icons';
import { Subscription } from 'rxjs';
import { CurrencyService } from '@services/platform/currency.service';
import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ICurrency } from '@lookups/currencyDetails.lookup';

@Component({
  selector: 'opdex-wallet-pool-position-details-modal',
  templateUrl: './wallet-pool-position-details-modal.component.html',
  styleUrls: ['./wallet-pool-position-details-modal.component.scss']
})
export class WalletPoolPositionDetailsModalComponent implements OnDestroy {
  selectedCurrency: ICurrency;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _selectedCurrency: CurrencyService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.subscription.add(
      this._selectedCurrency.selectedCurrency$
        .subscribe(currency => this.selectedCurrency = currency));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
