import { EnvironmentsService } from '@services/utility/environments.service';
import { ParameterType } from '@enums/parameter-type';
import { Parameter } from '@models/cirrusApi/contract-calls/parameter';
import { LocalCallPayload } from '@models/cirrusApi/contract-calls/local-call';
import { INodeWalletAddressModel } from '@interfaces/full-node.interface';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { firstValueFrom } from 'rxjs';

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

  async getAllowance(token: string, wallet: string, spender: string): Promise<void> {
    const request = new LocalCallPayload(token, 'Allowance', wallet, [
      new Parameter(ParameterType.Address, wallet),
      new Parameter(ParameterType.Address, spender)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));

    // Todo: Error handle
    if (response.errorMessage) {

    }

    const sats = response.return;
  }

  async getBalance(token: string, wallet: string): Promise<void> {
    if (token === 'CRS') {
      // Get CRS balance
    } else {
      const request = new LocalCallPayload(token, 'GetBalance', wallet, [
        new Parameter(ParameterType.Address, wallet)
      ]);

      const response = await firstValueFrom(this._cirrus.localCall(request));

      // Todo: Error handle
      if (response.errorMessage) {

      }

      const sats = response.return;
    }
  }

  async getStakingPosition(liquidityPool: string, wallet: string): Promise<void> {
    const request = new LocalCallPayload(liquidityPool, 'GetStakedBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));

    // Todo: Error handle
    if (response.errorMessage) {

    }

    const sats = response.return;
  }

  // Todo: Same as "getBalance()" maybe should just use that...
  async getMiningPosition(miningPool: string, wallet: string): Promise<void> {
    const request = new LocalCallPayload(miningPool, 'GetBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));

    // Todo: Error handle
    if (response.errorMessage) {

    }

    const sats = response.return;
  }

  async geVaultPledgePosition(proposalId: number, wallet: string): Promise<void> {
    const request = new LocalCallPayload(this._env.contracts.vault, 'GetProposalPledge', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));

    // Todo: Error handle
    if (response.errorMessage) {

    }

    const sats = response.return;
  }

  async geVaultVotePosition(proposalId: number, wallet: string): Promise<void> {
    const request = new LocalCallPayload(this._env.contracts.vault, 'GetProposalVote', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));

    // Todo: Error handle
    if (response.errorMessage) {

    }

    const sats = response.return;
  }
}
