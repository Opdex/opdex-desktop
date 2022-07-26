import { UserContextService } from '@services/utility/user-context.service';
import { RouterMethods } from '@enums/contracts/methods/router-methods';
import { MiningPoolMethods } from '@enums/contracts/methods/mining-pool-methods';
import { LiquidityPoolMethods } from '@enums/contracts/methods/liquidity-pool-methods';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { ParameterType } from '@enums/parameter-type';
import { MarketMethods } from '@enums/contracts/methods/market-methods';
import { TokenService } from '@services/platform/token.service';
import { EnvironmentsService } from '@services/utility/environments.service';
import { ILiquidityPoolEntity, IPagination } from '@interfaces/database.interface';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { Injectable } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, zip } from 'rxjs';
import { MiningPool } from '@models/platform/mining-pool';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { TransactionQuote } from '@interfaces/transaction-quote.interface';
import { LiquidityPoolStateKeys } from '@enums/contracts/state-keys/liquidity-pool-state-keys';
import { MiningPoolStateKeys } from '@enums/contracts/state-keys/mining-pool-state-keys';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';

export interface IBaseLiquidityPoolDetailsDto {
  address: string;
  token: string;
  miningPool: string;
  transactionFee: number;
}

export interface IHydratedLiquidityPoolDetailsDto {
  address: string;
  totalSupply: BigInt;
  reserveCrs: BigInt;
  reserveSrc: BigInt;
  totalStaked: BigInt;
  miningPeriodEndBlock: number;
}

export interface IMiningPoolDetailsDto {
  address: string;
  stakingToken: string;
  miningPeriodEndBlock: number;
  rewardRate: BigInt;
  totalSupply: BigInt;
}

@Injectable({providedIn: 'root'})
export class LiquidityPoolService {
  constructor(
    private _poolRepository: PoolRepositoryService,
    private _tokenService: TokenService,
    private _env: EnvironmentsService,
    private _context: UserContextService,
    private _cirrusApi: CirrusApiService
  ) { }

  public async buildLiquidityPool(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPoolBySrcToken(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolBySrcAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPoolByMiningPoolAddress(address: string): Promise<LiquidityPool> {
    const entity = await this._poolRepository.getPoolByMiningPoolAddress(address);
    return await this._buildLiquidityPool(entity);
  }

  public async buildLiquidityPools(skip: number, take: number): Promise<IPagination<LiquidityPool>> {
    const result = await this._poolRepository.getPools(skip, take);
    const pools = await Promise.all(result.results.map(entity => this._buildLiquidityPool(entity)));
    return { skip: result.skip, take: result.take, results: pools, count: result.count };
  }

  public async buildActiveMiningPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getActiveMiningPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  public async buildNominatedLiquidityPools(): Promise<LiquidityPool[]> {
    const entities = await this._poolRepository.getNominatedPools();
    return await Promise.all(entities.map(entity => this._buildLiquidityPool(entity)));
  }

  public async createLiquidityPoolQuote(token: string): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // Address CreatePool(Address token);
    const request = new LocalCallRequest(this._env.contracts.market, MarketMethods.CreatePool, wallet, [
      new Parameter(ParameterType.Address, token, 'Token')
    ]);

    return await this._submitQuote(request);
  }

  public async addLiquidityQuote(token: string, amountSrc: FixedDecimal, amountCrsMin: FixedDecimal, amountSrcMin: FixedDecimal, deadline: number): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // UInt256[] AddLiquidity(Address token, UInt256 amountSrcDesired, ulong amountCrsMin, UInt256 amountSrcMin, Address to, ulong deadline);
    const request = new LocalCallRequest(this._env.contracts.router, RouterMethods.AddLiquidity, wallet, [
      new Parameter(ParameterType.Address, token, 'Token'),
      new Parameter(ParameterType.UInt256, amountSrc.bigInt.toString(), 'SRC Amount'),
      new Parameter(ParameterType.ULong, amountCrsMin.bigInt.toString(), 'Min CRS Amount'),
      new Parameter(ParameterType.UInt256, amountSrcMin.bigInt.toString(), 'Min SRC Amount'),
      new Parameter(ParameterType.Address, wallet, 'Recipient'),
      new Parameter(ParameterType.ULong, deadline, 'Deadline'),
    ]);

    return await this._submitQuote(request);
  }

  public async removeLiquidityQuote(token: string, liquidity: FixedDecimal, amountCrsMin: FixedDecimal, amountSrcMin: FixedDecimal, deadline: number): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // UInt256[] RemoveLiquidity(Address token, UInt256 liquidity, ulong amountCrsMin, UInt256 amountSrcMin, Address to, ulong deadline);
    const request = new LocalCallRequest(this._env.contracts.router, RouterMethods.RemoveLiquidity, wallet, [
      new Parameter(ParameterType.Address, token, 'Token'),
      new Parameter(ParameterType.UInt256, liquidity.bigInt.toString(), 'Liquidity'),
      new Parameter(ParameterType.ULong, amountCrsMin.bigInt.toString(), 'Min CRS Amount'),
      new Parameter(ParameterType.UInt256, amountSrcMin.bigInt.toString(), 'Min SRC Amount'),
      new Parameter(ParameterType.Address, wallet, 'Recipient'),
      new Parameter(ParameterType.ULong, deadline, 'Deadline'),
    ]);

    return await this._submitQuote(request);
  }

  public async provideAmountInQuote(amountIn: FixedDecimal, reserveIn: FixedDecimal, reserveOut: FixedDecimal): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // UInt256 GetLiquidityQuote(UInt256 amountA, UInt256 reserveA, UInt256 reserveB);
    const request = new LocalCallRequest(this._env.contracts.router, RouterMethods.GetLiquidityQuote, wallet, [
      new Parameter(ParameterType.UInt256, amountIn.bigInt.toString(), 'Amount In'),
      new Parameter(ParameterType.UInt256, reserveIn.bigInt.toString(), 'Reserve A'),
      new Parameter(ParameterType.UInt256, reserveOut.bigInt.toString(), 'Reserve B'),
    ]);

    return await this._submitQuote(request);
  }

  public async startStakingQuote(liquidityPool: string, amount: FixedDecimal): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void StartStaking(UInt256 amount);
    const request = new LocalCallRequest(liquidityPool, LiquidityPoolMethods.StartStaking, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount')
    ]);

    return await this._submitQuote(request);
  }

  public async collectStakingRewardsQuote(liquidityPool: string, liquidate: boolean): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void CollectStakingRewards(bool liquidate);
    const request = new LocalCallRequest(liquidityPool, LiquidityPoolMethods.CollectStakingRewards, wallet, [
      new Parameter(ParameterType.Bool, liquidate.toString(), 'Liquidate')
    ]);

    return await this._submitQuote(request);
  }

  public async stopStakingQuote(liquidityPool: string, amount: FixedDecimal, liquidate: boolean): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void StopStaking(UInt256 amount, bool liquidate);
    const request = new LocalCallRequest(liquidityPool, LiquidityPoolMethods.StopStaking, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount'),
      new Parameter(ParameterType.Bool, liquidate.toString(), 'Liquidate')
    ]);

    return await this._submitQuote(request);
  }

  public async startMiningQuote(miningPool: string, amount: FixedDecimal): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void StartMining(UInt256 amount);
    const request = new LocalCallRequest(miningPool, MiningPoolMethods.StartMining, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount')
    ]);

    return await this._submitQuote(request);
  }

  public async stopMiningQuote(miningPool: string, amount: FixedDecimal): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void StopMining(UInt256 amount);
    const request = new LocalCallRequest(miningPool, MiningPoolMethods.StoptMining, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount')
    ]);

    return await this._submitQuote(request);
  }

  public async collectMiningRewardsQuote(miningPool: string): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void CollectMiningRewards();
    const request = new LocalCallRequest(miningPool, MiningPoolMethods.CollectMiningRewards, wallet);
    return await this._submitQuote(request);
  }

  private async _submitQuote(request: LocalCallRequest): Promise<TransactionQuote> {
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  private async _buildLiquidityPool(entity: ILiquidityPoolEntity): Promise<LiquidityPool> {
    if (!entity) return undefined;

    const hydrated = await firstValueFrom(this._getHydratedPool(entity.address, entity.miningPool));

    let miningPool = null;
    if (entity.srcToken !== this._env.contracts.odx) {
      const miningPoolDto = await firstValueFrom(this.getHydratedMiningPool(entity.miningPool));
      miningPool = new MiningPool(miningPoolDto);
    }

    const srcToken = await this._tokenService.buildToken(entity.srcToken);
    const stakingToken = await this._tokenService.buildToken(this._env.contracts.odx);
    const crsToken = await this._tokenService.buildToken('CRS');
    const lpToken = await this._tokenService.buildToken(entity.address);

    return new LiquidityPool(entity, hydrated, miningPool, srcToken, stakingToken, crsToken, lpToken);
  }

  // API

  getStaticPool(address: string): Observable<IBaseLiquidityPoolDetailsDto> {
    const properties = [
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.Token, ParameterType.Address),
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.TransactionFee, ParameterType.UInt),
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.MiningPool, ParameterType.Address),
    ];

    return zip(properties)
      .pipe(
        map(([token, transactionFee, miningPool]) => {
          return {
            address,
            token,
            transactionFee: parseFloat(transactionFee),
            miningPool
          };
        })
      );
  }

  private _getHydratedPool(address: string, miningPool: string): Observable<IHydratedLiquidityPoolDetailsDto> {
    const properties = [
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.TotalSupply, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.ReserveCrs, ParameterType.ULong).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.ReserveSrc, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(address, LiquidityPoolStateKeys.TotalStaked, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong).pipe(catchError(_ => of('0')))
    ];

    return zip(properties)
      .pipe(
        map(([totalSupply, reserveCrs, reserveSrc, totalStaked, miningPeriodEndBlock]) => {
          return {
            address,
            totalSupply: BigInt(totalSupply),
            reserveCrs: BigInt(reserveCrs),
            reserveSrc: BigInt(reserveSrc),
            totalStaked: BigInt(totalStaked),
            miningPeriodEndBlock: parseFloat(miningPeriodEndBlock)
          };
        }));
  }

  // Todo: Get Volume
  // -- Get all swaps within 5400 blocks
  // -- Add all CRS, Add all SRC
  // -- Calculate current CRS/SRC pricing
  // -- Calc volume by ($SRC * SrcTokenVolume) + ($CRS * CrsTokenVolume)

  getHydratedMiningPool(miningPool: string): Observable<IMiningPoolDetailsDto> {
    const properties = [
      this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.StakingToken, ParameterType.Address).pipe(catchError(_ => of(''))),
      this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.RewardRate, ParameterType.UInt256).pipe(catchError(_ => of('0'))),
      this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.TotalSupply, ParameterType.UInt256).pipe(catchError(_ => of('0')))
    ];

    return zip(properties)
      .pipe(
        map(([stakingToken, miningPeriodEndBlock, rewardRate, totalSupply]) => {
          return {
            stakingToken,
            miningPeriodEndBlock: parseFloat(miningPeriodEndBlock),
            rewardRate: BigInt(rewardRate),
            totalSupply: BigInt(totalSupply),
            address: miningPool
          };
        }));
  }

  getMiningPeriodEndBlocks(miningPools: string[]): Observable<{ miningPeriodEndBlock: number, miningPool: string}[]> {
    const uniquePools = miningPools
      .filter((value, index, self) => self.lastIndexOf(value) === index)

    const properties = uniquePools
      .map(miningPool => this._cirrusApi.getContractStorageItem(miningPool, MiningPoolStateKeys.MiningPeriodEndBlock, ParameterType.ULong))

    return zip(properties)
      .pipe(
        map(endBlocks => {
          return endBlocks.map((block, index) => {
            return {
              miningPeriodEndBlock: parseFloat(block),
              miningPool: uniquePools[index]
            }
          })
        }));
  }
}
