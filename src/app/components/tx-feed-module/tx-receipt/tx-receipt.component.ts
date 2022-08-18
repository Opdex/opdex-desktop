import { EnvironmentsService } from '@services/utility/environments.service';
import { Icons } from 'src/app/enums/icons';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { Component, Input } from '@angular/core';
import { Network } from 'src/app/enums/networks';
import { CollapseAnimation } from '@animations/collapse';

@Component({
  selector: 'opdex-tx-receipt',
  templateUrl: './tx-receipt.component.html',
  styleUrls: ['./tx-receipt.component.scss'],
  animations: [CollapseAnimation]
})
export class TxReceiptComponent {
  @Input() tx: TransactionReceipt;
  @Input() quote: any;
  // @Input() quote: ITransactionQuoteRequest;
  @Input() showBottomDivider: boolean = false;
  @Input() showTimeAgo: boolean = true;
  @Input() collapsed = true;

  icons = Icons;

  public get chain() {
    return this._env.network === Network.Mainnet ? 'crs' : 'tcrs';
  }

  constructor(private _env: EnvironmentsService) {}

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  copyHandler(event): void {
    event.stopPropagation();
  }
}
