import { LiquidityPool } from '@models/platform/liquidity-pool';
import { UserContextService } from '@services/utility/user-context.service';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { RouterMethods } from '@enums/contracts/methods/router-methods';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { ParameterType } from '@enums/parameter-type';
import { TokenMethods } from '@enums/contracts/methods/token-methods';
import { EnvironmentsService } from '@services/utility/environments.service';
import { PoolRepositoryService } from '@services/database/pool-repository.service';
import { IPagination, ITokenEntity } from '@interfaces/database.interface';
import { Token } from '@models/platform/token';
import { Injectable } from "@angular/core";
import { TokenRepositoryService } from "@services/database/token-repository.service";
import { catchError, firstValueFrom, map, Observable, of, zip } from 'rxjs';
import { LiquidityPoolStateKeys } from '@enums/contracts/state-keys/liquidity-pool-state-keys';
import { OdxStateKeys, StandardTokenStateKeys, InterfluxTokenStateKeys } from '@enums/contracts/state-keys/token-state-keys';
import { CurrencyService } from './currency.service';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';
import { TransactionQuote } from '@models/platform/transaction-quote';
import { ITokenDetailsDto, IHydratedTokenDetailsDto } from '@interfaces/contract-properties.interface';

@Injectable({providedIn: 'root'})
export class TokenService {
  constructor(
    private _tokenRepository: TokenRepositoryService,
    private _liquidityPoolRepository: PoolRepositoryService,
    private _env: EnvironmentsService,
    private _cirrusApi: CirrusApiService,
    private _currency: CurrencyService,
    private _context: UserContextService
  ) { }

  public async searchTokens(keyword: string): Promise<Token[]> {
    const entities = await this._tokenRepository.searchTokens(keyword);
    return await Promise.all(entities.map(entity => this._buildToken(entity)));
  }

  public async getTokens(skip: number, take: number): Promise<IPagination<Token>> {
    const result = await this._tokenRepository.getTokens(skip, take);
    const tokens = await Promise.all(result.results.map(entity => this._buildToken(entity)));
    return { skip: result.skip, take: result.take, results: tokens, count: result.count }
  }

  public async getToken(address: string): Promise<Token> {
    let entity: ITokenEntity = address === 'CRS'
      ? { address: 'CRS', symbol: 'CRS', name: 'Cirrus', decimals: 8, createdBlock: 1 }
      : await firstValueFrom(this._tokenRepository.getTokenByAddress(address));

    let isLpt = false;

    if (entity === undefined) {
      const pool = await firstValueFrom(this._liquidityPoolRepository.getPoolByAddress(address));

      // If is LP Token
      if (pool !== undefined) {
        entity = { address, symbol: 'OLPT', name: 'Liquidity Pool Token', decimals: 8, createdBlock: pool.createdBlock }
        isLpt = true;
      }
      // Else lookup the token from Cirrus
      else {
        const base = await firstValueFrom(this.getRawStaticTokenProperties(address));

        isLpt = base.symbol === 'OLPT' && base.name === 'Opdex Liquidity Pool Token';
        entity = {
          address: base.address,
          name: base.name,
          symbol: base.symbol,
          decimals: base.decimals,
          nativeChain: base.nativeChain || 'Cirrus',
          nativeChainAddress: base.nativeChainAddress,
          createdBlock: 0
        };
      }
    }

    return await this._buildToken(entity, isLpt);
  }

  public getRawStaticTokenProperties(address: string): Observable<ITokenDetailsDto> {
    const isODX = address === this._env.contracts.odx;

    const keys = {
      name: isODX ? OdxStateKeys.Name : StandardTokenStateKeys.Name,
      symbol: isODX ? OdxStateKeys.Symbol : StandardTokenStateKeys.Symbol,
      decimals: isODX ? OdxStateKeys.Decimals : StandardTokenStateKeys.Decimals,
      totalSupply: isODX ? OdxStateKeys.TotalSupply : StandardTokenStateKeys.TotalSupply
    };

    const properties = [
      this._cirrusApi.getContractStorageItem(address, keys.name, ParameterType.String),
      this._cirrusApi.getContractStorageItem(address, keys.symbol, ParameterType.String),
      this._cirrusApi.getContractStorageItem(address, keys.decimals, ParameterType.Byte),
      this._cirrusApi.getContractStorageItem(address, keys.totalSupply, ParameterType.UInt256),
      this._cirrusApi.getContractStorageItem(address, InterfluxTokenStateKeys.NativeChain, ParameterType.String).pipe(catchError(_ => of(''))),
      this._cirrusApi.getContractStorageItem(address, InterfluxTokenStateKeys.NativeAddress, ParameterType.String).pipe(catchError(_ => of(''))),
    ];

    return zip(properties)
      .pipe(map(([name, symbol, decimals, totalSupply, nativeChain, nativeChainAddress]) => {
        return {
          address,
          name,
          symbol,
          decimals: parseFloat(decimals),
          totalSupply: BigInt(totalSupply),
          nativeChain,
          nativeChainAddress
        }
      }));
  }

  ////////////////////////////////////////
  //          QUOTE METHODS             //
  ////////////////////////////////////////

  public async amountInQuote(amountOut: FixedDecimal, tokenIn: string, poolIn: LiquidityPool, poolOut: LiquidityPool): Promise<TransactionQuote> {
    // Need a sender for the local call, doesn't affect the outcome, fall back to router when user is not logged in.
    const sender = this._context.userContext.wallet.address || this._env.contracts.router;

    let parameters: Parameter[];

    if (!poolOut || poolIn.address === poolOut.address) {
      // CRS -> SRC
      // UInt256 GetAmountIn(UInt256 amountOut, UInt256 reserveIn, UInt256 reserveOut);
      const tokenInIsCrs = tokenIn === 'CRS';
      const reserveIn = tokenInIsCrs ? poolIn.reserveCrs.bigInt.toString() : poolIn.reserveSrc.bigInt.toString();
      const reserveOut = tokenInIsCrs ? poolIn.reserveSrc.bigInt.toString() : poolIn.reserveCrs.bigInt.toString();

      parameters = [
        new Parameter(ParameterType.UInt256, amountOut.bigInt.toString(), 'Amount Out'),
        new Parameter(ParameterType.UInt256, reserveIn, 'Reserve In'),
        new Parameter(ParameterType.UInt256, reserveOut, 'Reserve Out')
      ];
    } else {
      // SRC -> SRC
      // UInt256 GetAmountIn(UInt256 tokenOutAmount, UInt256 tokenOutReserveCrs, UInt256 tokenOutReserveSrc, UInt256 tokenInReserveCrs, UInt256 tokenInReserveSrc);
      parameters = [
        new Parameter(ParameterType.UInt256, amountOut.bigInt.toString(), 'Token Out Amount'),
        new Parameter(ParameterType.UInt256, poolOut.reserveCrs.bigInt.toString(), 'Token Out Reserve CRS'),
        new Parameter(ParameterType.UInt256, poolOut.reserveSrc.bigInt.toString(), 'Token Out Reserve SRC'),
        new Parameter(ParameterType.UInt256, poolIn.reserveCrs.bigInt.toString(), 'Token In Reserve CRS'),
        new Parameter(ParameterType.UInt256, poolIn.reserveSrc.bigInt.toString(), 'Token In Reserve SRC')
      ];
    }

    const request = new LocalCallRequest(this._env.contracts.router, RouterMethods.GetAmountIn, sender, parameters);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async amountOutQuote(amountIn: FixedDecimal, tokenIn: string, poolIn: LiquidityPool, poolOut: LiquidityPool): Promise<TransactionQuote> {
    // Need a sender for the local call, doesn't affect the outcome, fall back to router when user is not logged in.
    const sender = this._context.userContext.wallet.address || this._env.contracts.router;
    let parameters: Parameter[];

    if (!poolOut || poolIn.address === poolOut.address) {
      // CRS -> SRC
      // UInt256 GetAmountOut(UInt256 amountIn, UInt256 reserveIn, UInt256 reserveOut);
      const tokenInIsCrs = tokenIn === 'CRS';
      const reserveIn = tokenInIsCrs ? poolIn.reserveCrs.bigInt.toString() : poolIn.reserveSrc.bigInt.toString();
      const reserveOut = tokenInIsCrs ? poolIn.reserveSrc.bigInt.toString() : poolIn.reserveCrs.bigInt.toString();

      parameters = [
        new Parameter(ParameterType.UInt256, amountIn.bigInt.toString(), 'Amount In'),
        new Parameter(ParameterType.UInt256, reserveIn, 'Reserve In'),
        new Parameter(ParameterType.UInt256, reserveOut, 'Reserve Out')
      ];
    } else {
      // SRC -> SRC
      // UInt256 GetAmountOut(UInt256 tokenInAmount, UInt256 tokenInReserveCrs, UInt256 tokenInReserveSrc, UInt256 tokenOutReserveCrs, UInt256 tokenOutReserveSrc);
      parameters = [
        new Parameter(ParameterType.UInt256, amountIn.bigInt.toString(), 'Token In Amount'),
        new Parameter(ParameterType.UInt256, poolIn.reserveCrs.bigInt.toString(), 'Token In Reserve CRS'),
        new Parameter(ParameterType.UInt256, poolIn.reserveSrc.bigInt.toString(), 'Token In Reserve SRC'),
        new Parameter(ParameterType.UInt256, poolOut.reserveCrs.bigInt.toString(), 'Token Out Reserve CRS'),
        new Parameter(ParameterType.UInt256, poolOut.reserveSrc.bigInt.toString(), 'Token Out Reserve SRC')
      ];
    }

    const request = new LocalCallRequest(this._env.contracts.router, RouterMethods.GetAmountOut, sender, parameters);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async swapQuote(tokenIn: string, tokenOut: string, tokenInAmount: FixedDecimal, tokenOutAmount: FixedDecimal,
                   tokenInMaxAmount: FixedDecimal, tokenOutMinAmount: FixedDecimal, tokenInExact: boolean, deadline: number): Promise<TransactionQuote> {
    if (tokenIn === tokenOut) return null;

    const { wallet } = this._context.userContext;

    let methodName: RouterMethods;
    let parameters: Parameter[];
    let amount: FixedDecimal = FixedDecimal.Zero(8);

    if (tokenIn === 'CRS') {
      if (tokenInExact) {
        // Swap Exact CRS for SRC
        // UInt256 SwapExactCrsForSrc(UInt256 amountSrcOutMin, Address token, Address to, ulong deadline);
        methodName = RouterMethods.SwapExactCrsForSrc;
        amount = tokenInAmount;
        parameters = [
          new Parameter(ParameterType.UInt256, tokenOutMinAmount.bigInt.toString(), 'Minimum Amount Received'),
          new Parameter(ParameterType.Address, tokenOut, 'Token Received'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      } else {
        // Swap CRS for Exact SRC
        // ulong SwapCrsForExactSrc(UInt256 amountSrcOut, Address token, Address to, ulong deadline);
        methodName = RouterMethods.SwapCrsForExactSrc;
        amount = tokenInMaxAmount;
        parameters = [
          new Parameter(ParameterType.UInt256, tokenOutAmount.bigInt.toString(), 'Amount Received'),
          new Parameter(ParameterType.Address, tokenOut, 'Token Received'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      }
    } else if (tokenOut === 'CRS') {
      if (tokenInExact) {
        // Swap Exact SRC for CRS
        // ulong SwapExactSrcForCrs(UInt256 amountSrcIn, ulong amountCrsOutMin, Address token, Address to, ulong deadline);
        methodName = RouterMethods.SwapExactSrcForCrs;
        parameters = [
          new Parameter(ParameterType.UInt256, tokenInAmount.bigInt.toString(), 'Amount Spent'),
          new Parameter(ParameterType.ULong, tokenOutMinAmount.bigInt.toString(), 'Minimum Amount Received'),
          new Parameter(ParameterType.Address, tokenIn, 'Token Spent'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      } else {
        // Swap SRC for Exact CRS
        // UInt256 SwapSrcForExactCrs(ulong amountCrsOut, UInt256 amountSrcInMax, Address token, Address to, ulong deadline);
        methodName = RouterMethods.SwapSrcForExactCrs;
        parameters = [
          new Parameter(ParameterType.ULong, tokenOutAmount.bigInt.toString(), 'Amount Received'),
          new Parameter(ParameterType.UInt256, tokenInMaxAmount.bigInt.toString(), 'Maximum Amount Spent'),
          new Parameter(ParameterType.Address, tokenIn, 'Token Spent'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      }
    } else {
      if (tokenInExact) {
        // Swap Exact SRC for SRC
        // UInt256 SwapExactSrcForSrc(UInt256 amountSrcIn, Address tokenIn, UInt256 amountSrcOutMin, Address tokenOut, Address to, ulong deadline);
        methodName = RouterMethods.SwapExactSrcForSrc;
        parameters = [
          new Parameter(ParameterType.UInt256, tokenInAmount.bigInt.toString(), 'Amount Spent'),
          new Parameter(ParameterType.Address, tokenIn, 'Token Spent'),
          new Parameter(ParameterType.UInt256, tokenOutMinAmount.bigInt.toString(), 'Minimum Amount Received'),
          new Parameter(ParameterType.Address, tokenOut, 'Token Received'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      } else {
        // Swap SRC for Exact SRC
        // UInt256 SwapSrcForExactSrc(UInt256 amountSrcInMax, Address tokenIn, UInt256 amountSrcOut, Address tokenOut, Address to, ulong deadline);
        methodName = RouterMethods.SwapSrcForExactSrc;
        parameters = [
          new Parameter(ParameterType.UInt256, tokenInMaxAmount.bigInt.toString(), 'Maximum Amount Spent'),
          new Parameter(ParameterType.Address, tokenIn, 'Token Spent'),
          new Parameter(ParameterType.UInt256, tokenOutAmount.bigInt.toString(), 'Amount Received'),
          new Parameter(ParameterType.Address, tokenOut, 'Token Received'),
          new Parameter(ParameterType.Address, wallet.address, 'Recipient'),
          new Parameter(ParameterType.ULong, deadline, 'Deadline'),
        ];
      }
    }

    const request = new LocalCallRequest(this._env.contracts.router, methodName, wallet.address, parameters, amount.formattedValue);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async distributionQuote(): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // void Distribute();
    const request = new LocalCallRequest(this._env.contracts.odx, TokenMethods.Distribute, wallet.address);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async allowanceApprovalQuote(token: string, spender: string, currentAmount: FixedDecimal, amount: FixedDecimal): Promise<TransactionQuote> {
    const { wallet } = this._context.userContext;

    // UInt256 Approve(Address spender, UInt256 currentAmount, UInt256 amount);
    const request = new LocalCallRequest(token, TokenMethods.Approve, wallet.address, [
      new Parameter(ParameterType.Address, spender, 'Spender'),
      new Parameter(ParameterType.UInt256, currentAmount.bigInt.toString(), 'Current Amount'),
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'New Amount'),
    ]);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  ////////////////////////////////////////
  //          HELPER METHODS            //
  ////////////////////////////////////////

  private async _buildToken(entity: ITokenEntity, lpToken: boolean = false): Promise<Token> {
    const hydrated = entity.address === 'CRS'
      ? { totalSupply: BigInt('10000000000000000') } // 100M
      : await firstValueFrom(this._getRawHydratedToken$(entity.address, lpToken));

    const pricing = await this._getTokenPricing(entity);

    let trusted = false;
    if (entity.nativeChainAddress) {
      const supportedTokens = await firstValueFrom(this._cirrusApi.getSupportedInterfluxTokens());
      trusted = supportedTokens.find(token => token.nativeChainAddress === entity.nativeChainAddress) !== undefined;
    }

    return new Token(entity, hydrated, pricing, trusted);
  }

  private _getRawHydratedToken$(address: string, lpToken: boolean = false): Observable<IHydratedTokenDetailsDto> {
    const isODX = address === this._env.contracts.odx;
    const totalSupplyKey = isODX
      ? OdxStateKeys.TotalSupply
      : lpToken
        ? LiquidityPoolStateKeys.TotalSupply
        : StandardTokenStateKeys.TotalSupply;

    const properties = [
      this._cirrusApi.getContractStorageItem(address, totalSupplyKey, ParameterType.UInt256).pipe(catchError(_ => of('0')))
    ];

    if (isODX) {
      properties.push(
        this._cirrusApi.getContractStorageItem(address, OdxStateKeys.NextDistributionBlock, ParameterType.ULong),
        this._cirrusApi.getContractStorageItem(address, OdxStateKeys.PeriodDuration, ParameterType.ULong),
        this._cirrusApi.getContractStorageItem(address, OdxStateKeys.PeriodIndex, ParameterType.UInt)
      );
    }

    return zip(properties)
      .pipe(
        map(values => {
          let data: any = {
            totalSupply: BigInt(values[0])
          };

          if (isODX) {
            data.nextDistributionBlock = parseFloat(values[1]);
            data.periodDuration = parseFloat(values[2]);
            data.periodIndex = parseFloat(values[3]);
          }

          return data;
        })
      )
  }

  private async _getTokenPricing(token: ITokenEntity): Promise<any> {
    const { pricing } = this._currency;
    let prices: any = { }

    if (token.address === 'CRS') {
      pricing.forEach(currency => prices[currency.abbreviation] = currency.price);
      return prices;
    }

    const pool = await firstValueFrom(this._liquidityPoolRepository.getPoolBySrcAddress(token.address)) ||
                 await firstValueFrom(this._liquidityPoolRepository.getPoolByAddress(token.address));

    if (!pool) return prices;

    if /* LP Token */ (pool.address === token.address) {
      const totalSupply = await this._getStorageFixedDecimal(token.address, LiquidityPoolStateKeys.TotalSupply, ParameterType.UInt256, token.decimals);
      const reserveCrs = await this._getStorageFixedDecimal(token.address, LiquidityPoolStateKeys.ReserveCrs, ParameterType.ULong, 8);

      pricing.forEach(currency => prices[currency.abbreviation] = currency.price.multiply(reserveCrs).multiply(new FixedDecimal('2', 8)).divide(totalSupply));

      return prices;
    } else /* SRC Token */ {
      const reserveCrs = await this._getStorageFixedDecimal(pool.address, LiquidityPoolStateKeys.ReserveCrs, ParameterType.ULong, 8);
      const reserveSrc = await this._getStorageFixedDecimal(pool.address, LiquidityPoolStateKeys.ReserveSrc, ParameterType.UInt256, token.decimals);
      const crsPerSrc = reserveCrs.divide(reserveSrc);

      pricing.forEach(currency => prices[currency.abbreviation] = currency.price.multiply(crsPerSrc));

      return prices;
    }
  }

  public async getHistoricalTokenPricing(block: number, crsPrice: FixedDecimal, token: Token): Promise<FixedDecimal> {
    let price = FixedDecimal.Zero(8);

    if (token.isCrs) return crsPrice;

    const pool = await firstValueFrom(this._liquidityPoolRepository.getPoolBySrcAddress(token.address)) ||
                 await firstValueFrom(this._liquidityPoolRepository.getPoolByAddress(token.address));

    const reservesRequest = new LocalCallRequest(pool.address, 'get_Reserves', pool.address, [], '0', block);
    const reservesResponse = await firstValueFrom(this._cirrusApi.localCall(reservesRequest));
    const reserveCrs = !!reservesResponse.return ? FixedDecimal.FromBigInt(reservesResponse.return[0], 8) : FixedDecimal.Zero(8);
    const reserveSrc = !!reservesResponse.return ? FixedDecimal.FromBigInt(reservesResponse.return[1], token.decimals) : FixedDecimal.Zero(token.decimals);


    if /* LP Token */ (pool.address === token.address) {
      const totalSupplyRequest = new LocalCallRequest(pool.address, 'get_TotalSupply', pool.address, [], '0', block);
      const totalSupplyResponse = await firstValueFrom(this._cirrusApi.localCall(totalSupplyRequest));
      const totalSupply = FixedDecimal.FromBigInt(totalSupplyResponse.return, 8);
      price = crsPrice.multiply(reserveCrs).multiply(new FixedDecimal('2', 8)).divide(totalSupply);
    }
    else /* SRC Token */ {
      const crsPerSrc = reserveCrs.divide(reserveSrc);
      price = crsPrice.multiply(crsPerSrc);
    }

    return price;
  }

  private async _getStorageFixedDecimal(address: string, stateKey: string, parameterType: ParameterType, decimals: number): Promise<FixedDecimal> {
    const call = this._cirrusApi.getContractStorageItem(address, stateKey, parameterType).pipe(catchError(_ => of('0')));
    const response = await firstValueFrom(call);
    return FixedDecimal.FromBigInt(BigInt(response), decimals);
  }
}
