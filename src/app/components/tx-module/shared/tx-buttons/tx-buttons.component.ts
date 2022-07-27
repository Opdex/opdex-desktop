import { Icons } from 'src/app/enums/icons';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-tx-buttons',
  templateUrl: './tx-buttons.component.html',
  styleUrls: ['./tx-buttons.component.scss']
})
export class TxButtonsComponent {
  @Output() onSelectOption = new EventEmitter<TransactionView>();
  @Input() disableStaking = false;
  @Input() disableMining = false;
  @Input() hideStaking = false;
  @Input() hideMining = false;

  icons = Icons;
  transactionViews = TransactionView;

  selectOption(option: TransactionView) {
    this.onSelectOption.emit(option);
  }
}
