import { LiquidityPool } from '@models/platform/liquidity-pool';
import { Component, Input } from '@angular/core';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-tx-trade',
  templateUrl: './tx-trade.component.html',
  styleUrls: ['./tx-trade.component.scss']
})
export class TxTradeComponent {
  @Input() pool: LiquidityPool;
  view: TransactionView;

  constructor() {
    this.view = TransactionView.swap;
  }

  handlePoolSelection(pool: LiquidityPool) {
    this.pool = pool;
  }

  handleTxOption(view: TransactionView) {
    this.view = view;
  }
}
