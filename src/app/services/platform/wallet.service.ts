import { EnvironmentsService } from '@services/utility/environments.service';
import { ParameterType } from '@enums/parameter-type';
import { INodeWalletAddressModel, IContractReceiptResult } from '@interfaces/full-node.interface';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { firstValueFrom } from 'rxjs';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';
import { UserContext } from '@models/user-context';
import { TransactionReceipt } from '@models/platform/transactionReceipt';

@Injectable({providedIn: 'root'})
export class WalletService {
  constructor(
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  public async getWalletList(): Promise<string[]> {
    const response = await firstValueFrom(this._cirrus.getWalletsList());
    return response?.walletNames || [];
  }

  public async getWalletAddresses(walletName: string): Promise<INodeWalletAddressModel[]> {
    const response = await firstValueFrom(this._cirrus.getAddresses(walletName));
    return response?.addresses || [];
  }

  public async getWalletHistory(context: UserContext, skip: number = 0, take: number = 10): Promise<IContractReceiptResult[]> {
    const history = await firstValueFrom(this._cirrus.getHistory(context.wallet.name, context.wallet.address));
    return await Promise.all(history.map(tx => firstValueFrom(this._cirrus.getContractReceipt(tx.hash))));
  }

  async getAllowance(token: string, wallet: string, spender: string): Promise<BigInt> {
    const request = new LocalCallRequest(token, 'Allowance', wallet, [
      new Parameter(ParameterType.Address, wallet),
      new Parameter(ParameterType.Address, spender)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  async getBalance(token: string, wallet: string): Promise<BigInt> {
    if (token === 'CRS') {
      const response = await firstValueFrom(this._cirrus.getAddressBalance(wallet));
      return BigInt(response);
    } else {
      const request = new LocalCallRequest(token, 'GetBalance', wallet, [
        new Parameter(ParameterType.Address, wallet)
      ]);

      const response = await firstValueFrom(this._cirrus.localCall(request));
      return BigInt(response.errorMessage ? '0' : response.return);
    }
  }

  async getStakingPosition(liquidityPool: string, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(liquidityPool, 'GetStakedBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  // Todo: Same as "getBalance()" maybe should just use that...
  async getMiningPosition(miningPool: string, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(miningPool, 'GetBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  async getVaultPledgePosition(proposalId: number, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(this._env.contracts.vault, 'GetProposalPledge', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  async getVaultVotePosition(proposalId: number, wallet: string): Promise<{balance: BigInt, inFavor: boolean}> {
    const request = new LocalCallRequest(this._env.contracts.vault, 'GetProposalVote', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return {
      balance: BigInt(response.errorMessage ? '0' : response.return.amount),
      inFavor: response.errorMessage ? false : response.return.inFavor
    };
  }
}
