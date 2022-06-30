import { MiningGovernance } from '@models/platform/mining-governance';
import { NodeService } from '@services/platform/node.service';
import { Subscription, switchMap } from 'rxjs';
import { MiningGovernanceFactoryService } from '@services/factory/mining-governance-factory.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Icons } from '@enums/icons';

@Component({
  selector: 'opdex-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit, OnDestroy {
  miningGovernance: MiningGovernance;
  subscription = new Subscription();
  icons = Icons;

  constructor(
    private _miningGovernanceFactory: MiningGovernanceFactoryService,
    private _nodeService: NodeService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          switchMap(latestBlock => this._miningGovernanceFactory.buildMiningGovernance(latestBlock))
        )
    .subscribe(gov => this.miningGovernance = gov));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
