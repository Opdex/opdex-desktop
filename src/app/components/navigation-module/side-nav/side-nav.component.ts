import { IndexerService } from '@services/platform/indexer.service';
import { TermsModalComponent } from '@components/modals-module/terms-modal/terms-modal.component';
import { Network } from '@enums/networks';
import { UserContext } from '@models/user-context';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Icons } from '@enums/icons';
import { MatDialog } from '@angular/material/dialog';
import { UserContextService } from '@services/utility/user-context.service';
import { Router } from '@angular/router';
import { BugReportModalComponent } from '@components/modals-module/bug-report-modal/bug-report-modal.component';
import { EnvironmentsService } from '@services/utility/environments.service';

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
  network: Network;
  subscription = new Subscription();
  pendingTransactions: string[] = [];
  context: UserContext;

  constructor(
    public dialog: MatDialog,
    private _userContextService: UserContextService,
    private _indexerService: IndexerService,
    private _router: Router,
    private _env: EnvironmentsService
  ) {
    this.subscription.add(this._userContextService.context$.subscribe(context => this.context = context));
    this.latestSyncedBlock$ = this._indexerService.latestBlock$;
    this.network = this._env.network;
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

  openTerms(): void {
    this.dialog.open(TermsModalComponent, { width: '500px' });
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
