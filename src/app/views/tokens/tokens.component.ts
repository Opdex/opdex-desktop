import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-tokens',
  templateUrl: './tokens.component.html',
  styleUrls: ['./tokens.component.scss']
})
export class TokensComponent {
  constructor(private _router: Router) {}

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], {queryParams: {view}})
  }
}
