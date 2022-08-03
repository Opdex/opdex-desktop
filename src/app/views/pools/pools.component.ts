import { Subscription } from 'rxjs';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { CreatePoolModalComponent } from '@components/modals-module/create-pool-modal/create-pool-modal.component';
import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Icons } from '@enums/icons';
import { TransactionView } from '@enums/transaction-view';

@Component({
  selector: 'opdex-pools',
  templateUrl: './pools.component.html',
  styleUrls: ['./pools.component.scss']
})
export class PoolsComponent implements OnDestroy {
  context: UserContext;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    public dialog: MatDialog,
    private _router: Router,
    private _userContextService: UserContextService
  ) {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  handleTxOption(view: TransactionView) {
    this._router.navigate(['/trade'], {queryParams: {view}})
  }

  createPool(): void {
    this.dialog.open(CreatePoolModalComponent, { width: '500px' });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
