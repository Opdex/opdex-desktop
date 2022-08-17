import { take } from 'rxjs/operators';
import { ConfirmResyncModalComponent } from '@components/modals-module/confirm-resync-modal/confirm-resync-modal.component';
import { IndexerService } from '@services/platform/indexer.service';
import { INodeStatus } from '@interfaces/full-node.interface';
import { MatDialog } from '@angular/material/dialog';
import { Icons } from '@enums/icons';
import { NodeService } from '@services/platform/node.service';
import { Network } from '@enums/networks';
import { SemVer } from 'semver';
import { EnvironmentsService } from '@services/utility/environments.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { BugReportModalComponent } from '@components/modals-module/bug-report-modal/bug-report-modal.component';

@Component({
  selector: 'opdex-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {
  appVersion: SemVer;
  network: Network;
  latestBlock: number;
  nodeStatus: INodeStatus;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _env: EnvironmentsService,
    private _nodeService: NodeService,
    private _indexerService: IndexerService,
    public dialog: MatDialog
  ) {
    this.appVersion = this._env.version;
    this.network = this._env.network;
  }

  ngOnInit(): void {
    this.subscription.add(
      this._indexerService.latestBlock$
        .subscribe(latestBlock => this.latestBlock = latestBlock));

    this.subscription.add(
      this._nodeService.status$
        .subscribe(nodeStatus => this.nodeStatus = nodeStatus));
  }

  async resync(): Promise<void> {
    this.dialog.open(ConfirmResyncModalComponent, { width: '500px' })
      .afterClosed()
      .pipe(take(1))
      .subscribe(async result => {
        if (!!result) await this._indexerService.index(true);
      });
  }

  openBugReport(): void {
    this.dialog.open(BugReportModalComponent, { width: '500px' });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
