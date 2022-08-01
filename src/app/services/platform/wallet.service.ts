import { EnvironmentsService } from '@services/utility/environments.service';
import { ParameterType } from '@enums/parameter-type';
import { INodeWalletAddressModel } from '@interfaces/full-node.interface';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { firstValueFrom } from 'rxjs';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';
import { FixedDecimal } from '@models/types/fixed-decimal';

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

  async getVaultVotePosition(proposalId: number, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(this._env.contracts.vault, 'GetProposalVote', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }
}
