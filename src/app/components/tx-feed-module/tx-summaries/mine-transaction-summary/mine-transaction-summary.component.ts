import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { IStopMiningEvent } from '@models/platform-api/responses/transactions/transaction-events/mining-pools/stop-mining-event.interface';
import { IStartMiningEvent } from '@models/platform-api/responses/transactions/transaction-events/mining-pools/start-mining-event.interface';
import { ICollectMiningRewardsEvent } from '@models/platform-api/responses/transactions/transaction-events/mining-pools/collect-mining-rewards-event.interface';
import { MiningPoolsService } from '@services/platform/mining-pools.service';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Subscription } from 'rxjs';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { switchMap, take } from 'rxjs/operators';
import { IMiningPool } from '@models/platform-api/responses/mining-pools/mining-pool.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-mine-transaction-summary',
  templateUrl: './mine-transaction-summary.component.html',
  styleUrls: ['./mine-transaction-summary.component.scss']
})
export class MineTransactionSummaryComponent implements OnChanges, OnDestroy {
  @Input() transaction: TransactionReceipt;

  isAddition: boolean;
  lptAmount: FixedDecimal;
  collectAmount: FixedDecimal;
  pool: LiquidityPool;
  subscription = new Subscription();
  error: string;
  eventTypes = [
    TransactionLogTypes.StartMiningLog,
    TransactionLogTypes.StopMiningLog,
    TransactionLogTypes.CollectMiningRewardsLog
  ]

  constructor(
    private _liquidityPoolService: LiquidityPoolFactoryService,
    private _miningPoolService: MiningPoolsService
  ) { }

  ngOnChanges(): void {
    const mineEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.eventType));

    var collectEvent = mineEvents.find(event => event.eventType === TransactionLogTypes.CollectMiningRewardsLog) as ICollectMiningRewardsEvent;
    var startEvent = mineEvents.find(event => event.eventType === TransactionLogTypes.StartMiningLog) as IStartMiningEvent;
    var stopEvent = mineEvents.find(event => event.eventType === TransactionLogTypes.StopMiningLog) as IStopMiningEvent;

    if (mineEvents.length > 2 || mineEvents.length === 0 || (!collectEvent && !startEvent && !stopEvent)) {
      this.error = 'Unable to read mine transaction.';
      return;
    }

    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    this.subscription.add(
      this._miningPoolService.getMiningPool(startEvent?.contract || stopEvent?.contract || collectEvent?.contract)
        .pipe(
          switchMap((miningPool: IMiningPool) => this._liquidityPoolService.buildLiquidityPool(miningPool.liquidityPool)),
          take(1))
        .subscribe((liquidityPool: LiquidityPool) => {
          this.pool = liquidityPool;

          const collectAmount = collectEvent === undefined ? '0' : collectEvent.amount;
          this.collectAmount = new FixedDecimal(collectAmount, liquidityPool.stakingToken?.decimals);

          let lptAmount = FixedDecimal.Zero(liquidityPool.lpToken.decimals);

          if (startEvent !== undefined) {
            this.isAddition = true;
            lptAmount = new FixedDecimal(startEvent.amount, liquidityPool.lpToken.decimals);
          }
          else if (stopEvent !== undefined) {
            this.isAddition = false;
            lptAmount = new FixedDecimal(stopEvent.amount, liquidityPool.lpToken.decimals);
          }

          this.lptAmount = lptAmount;
        }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
