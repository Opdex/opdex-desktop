import { EnvironmentsService } from '@services/utility/environments.service';
import { ParameterType } from '@enums/parameter-type';
import { INodeWalletAddressModel } from '@interfaces/full-node.interface';
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

  public async getWalletHistory(context: UserContext, skip: number = 0, take: number = 10): Promise<TransactionReceipt[]> {
    const { wallet } = context;
    const history = await firstValueFrom(this._cirrus.getHistory(wallet.name, wallet.address, skip, take));
    const txs = await Promise.all(history.map(tx => firstValueFrom(this._cirrus.getContractReceipt(tx.hash))));
    const blocks = await Promise.all(txs.map(tx => firstValueFrom(this._cirrus.getBlockByHash(tx.blockHash))));
    return txs.map(tx =>{
      const walletHistory = history.find(item => item.hash === tx.transactionHash);
      const block = blocks.find(block => block.hash === tx.blockHash);
      return new TransactionReceipt(tx, walletHistory, new Date(block.mediantime * 1000));
    });
  }

  public async getAllowance(token: string, wallet: string, spender: string): Promise<BigInt> {
    const request = new LocalCallRequest(token, 'Allowance', wallet, [
      new Parameter(ParameterType.Address, wallet),
      new Parameter(ParameterType.Address, spender)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  public async getBalance(token: string, wallet: string): Promise<BigInt> {
    if (token === 'CRS') {
      const response = await firstValueFrom(this._cirrus.getAddressBalance(wallet));
      return BigInt(response);
    } else {
      return await this._getBalance(token, wallet);
    }
  }

  public async getStakingPosition(liquidityPool: string, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(liquidityPool, 'GetStakedBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  public async getMiningPosition(miningPool: string, wallet: string): Promise<BigInt> {
    return await this._getBalance(miningPool, wallet);
  }

  public async getVaultPledgePosition(proposalId: number, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(this._env.contracts.vault, 'GetProposalPledge', wallet, [
      new Parameter(ParameterType.ULong, proposalId),
      new Parameter(ParameterType.Address, wallet),
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }

  public async getVaultVotePosition(proposalId: number, wallet: string): Promise<{balance: BigInt, inFavor: boolean}> {
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

  ////////////////////////////////////////
  //          HELPER METHODS            //
  ////////////////////////////////////////

  private async _getBalance(address: string, wallet: string): Promise<BigInt> {
    const request = new LocalCallRequest(address, 'GetBalance', wallet, [
      new Parameter(ParameterType.Address, wallet)
    ]);

    const response = await firstValueFrom(this._cirrus.localCall(request));
    return BigInt(response.errorMessage ? '0' : response.return);
  }
}
