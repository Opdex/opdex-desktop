import { UserContext } from '@models/user-context';
import { NodeService } from '@services/platform/node.service';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Icons } from '@enums/icons';
import { MatDialog } from '@angular/material/dialog';
import { UserContextService } from '@services/utility/user-context.service';
import { Router } from '@angular/router';
import { BugReportModalComponent } from '@components/modals-module/bug-report-modal/bug-report-modal.component';

@Component({
  selector: 'opdex-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnDestroy {
  @Output() onPinnedToggle = new EventEmitter<boolean>();
  @Output() onRouteChanged = new EventEmitter<string>();
  @Input() mobileMenuOpen: boolean;
  isPinned: boolean = true;
  latestSyncedBlock$: Observable<number>;
  icons = Icons;
  network: string;
  subscription = new Subscription();
  pendingTransactions: string[] = [];
  context: UserContext;

  constructor(
    public dialog: MatDialog,
    private _userContextService: UserContextService,
    private _indexService: NodeService,
    private _router: Router,
    // private _transactionsService: TransactionsService,
    // private _env: EnvironmentsService,
    // private _authService: AuthService
  ) {
    this.subscription.add(this._userContextService.context$.subscribe(context => this.context = context));
    // this.subscription.add(this._transactionsService.getBroadcastedTransactions$().subscribe(txs => this.pendingTransactions = txs));
    this.latestSyncedBlock$ = this._indexService.latestBlock$;

    // const { network } = this._env;
    // this.network = network;
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    this.onPinnedToggle.emit(this.isPinned);
  }

  emitRouteChange(url: string): void {
    this.onRouteChanged.emit(url);
  }

  openBugReport(): void {
    this.dialog.open(BugReportModalComponent, { width: '500px' });
  }

  logout(): void {
    this._userContextService.remove();
    this._router.navigateByUrl('/');
    this.emitRouteChange('/');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
