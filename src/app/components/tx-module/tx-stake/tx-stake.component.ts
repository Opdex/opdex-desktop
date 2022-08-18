import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TransactionView } from '@enums/transaction-view';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-tx-stake',
  templateUrl: './tx-stake.component.html',
  styleUrls: ['./tx-stake.component.scss']
})
export class TxStakeComponent {
  @Input() data: any = {};
  @Output() onPoolSelection = new EventEmitter<LiquidityPool>();
  pool: LiquidityPool;
  view = TransactionView.stake;
  child: number = 1;
  txOptions = [
    { action: 'Start', value: 1 },
    { action: 'Stop', value: 2 },
    { action: 'Collect', value: 3 }
  ];

  ngOnChanges() {
    this.child = this.txOptions.find(o => o.action.toLowerCase() == this.data?.childView)?.value || 1;
    this.pool = this.data?.pool;
  }

  handlePoolChange(pool: LiquidityPool) {
    this.onPoolSelection.emit(pool);
  }
}
