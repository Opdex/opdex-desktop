import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-pools',
  templateUrl: './pools.component.html',
  styleUrls: ['./pools.component.scss']
})
export class PoolsComponent {
  constructor(private _router: Router) {}

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], {queryParams: {view}})
  }
}
