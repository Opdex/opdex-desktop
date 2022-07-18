import { IBurnLog, IStartStakingLog, IStopStakingLog, ICollectStakingRewardsLog } from '@interfaces/contract-logs.interface';
import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Token } from '@models/platform/token';
import { Component, Input, OnChanges } from '@angular/core';
import { TransactionReceipt } from '@models/platform/transactionReceipt';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { LiquidityPool } from '@models/platform/liquidity-pool';

@Component({
  selector: 'opdex-stake-transaction-summary',
  templateUrl: './stake-transaction-summary.component.html',
  styleUrls: ['./stake-transaction-summary.component.scss']
})
export class StakeTransactionSummaryComponent implements OnChanges {
  @Input() transaction: TransactionReceipt;

  isAddition: boolean;
  isCollection: boolean;
  collectionLiquidatedRewards: boolean;
  stakingAmount: FixedDecimal;
  amountOneToken: Token;
  amountTwoToken: Token;
  collectAmountOne: FixedDecimal; // Could be OLPT, or if liquidated, CRS
  collectAmountTwo: FixedDecimal; // If liquidated, SRC
  pool: LiquidityPool;
  error: string;
  eventTypes = [
    TransactionLogTypes.StartStakingLog,
    TransactionLogTypes.StopStakingLog,
    TransactionLogTypes.CollectStakingRewardsLog,
    TransactionLogTypes.BurnLog
  ]

  constructor(
    private _liquidityPoolService: LiquidityPoolFactoryService
  ) { }

  async ngOnChanges(): Promise<void> {
    const stakeEvents = this.transaction.events.filter(event => this.eventTypes.includes(event.log.event as TransactionLogTypes));

    var startEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.StartStakingLog);
    var stopEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.StopStakingLog);
    var collectEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.CollectStakingRewardsLog);
    var burnEvent = stakeEvents.find(event => event.log.event === TransactionLogTypes.BurnLog);

    if (stakeEvents.length > 4 || stakeEvents.length === 0 || (!collectEvent && !startEvent && !stopEvent)) {
      this.error = 'Unable to read stake transaction.';
      return;
    }

    // Todo: could be collection only...
    this.isAddition = startEvent !== undefined;
    this.isCollection = collectEvent !== undefined;
    this.collectionLiquidatedRewards = this.isCollection && burnEvent !== undefined;
    this.pool = await this._liquidityPoolService.buildLiquidityPool(startEvent?.address || stopEvent?.address || collectEvent?.address);

    let stakingAmount: BigInt;

    if (!!startEvent) stakingAmount = (<IStartStakingLog>startEvent.log.data).amount;
    else if (!!stopEvent) stakingAmount = (<IStopStakingLog>stopEvent.log.data).amount;
    else stakingAmount = BigInt('0');

    this.stakingAmount = FixedDecimal.FromBigInt(stakingAmount, this.pool.stakingToken?.decimals);

    if (this.isCollection) {
      if (this.collectionLiquidatedRewards) {
        this.amountOneToken = this.pool.crsToken;
        this.amountTwoToken = this.pool.srcToken;

        const burnLog = <IBurnLog>burnEvent.log.data;
        const amountOne = burnLog.amountCrs;
        const amountTwo = burnLog.amountSrc;

        this.collectAmountOne = FixedDecimal.FromBigInt(amountOne, this.amountOneToken.decimals);
        this.collectAmountTwo = FixedDecimal.FromBigInt(amountTwo, this.amountTwoToken.decimals);
      } else {
        const collectionLog = <ICollectStakingRewardsLog>collectEvent.log.data;

        this.amountOneToken = this.pool.lpToken;
        this.collectAmountOne = FixedDecimal.FromBigInt(collectionLog.amount, this.amountOneToken.decimals);
      }
    }
  }
}
