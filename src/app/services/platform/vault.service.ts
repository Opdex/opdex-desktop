import { CirrusApiService } from '@services/api/cirrus-api.service';
import { EnvironmentsService } from '@services/utility/environments.service';
import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { Injectable } from "@angular/core";
import { Vault } from '@models/platform/vault';
import { catchError, firstValueFrom, map, Observable, of, zip } from 'rxjs';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { VaultProposal } from '@models/platform/vault-proposal';
import { IPagination, IVaultProposalEntity } from '@interfaces/database.interface';
import { VaultStateKeys } from '@enums/contracts/state-keys/vault-state-keys';
import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { ParameterType } from '@enums/parameter-type';
import { ReceiptSearchRequest } from '@models/cirrusApi/receipt-search';
import { LocalCallRequest, Parameter } from '@models/cirrusApi/contract-call';

export interface IHydratedVault {
  token: string;
  totalSupply: BigInt;
  vestingDuration: number;
  totalProposedAmount: BigInt;
  totalPledgeMinimum: BigInt;
  totalVoteMinimum: BigInt;
  balance: BigInt;
}

export interface IHydratedProposal {
  amount: BigInt;
  type: number;
  status: number;
  wallet: string;
  expiration: number;
  pledgeAmount: BigInt;
  noAmount: BigInt;
  yesAmount: BigInt;
}

@Injectable({providedIn: 'root'})
export class VaultService {
  constructor(
    private _vaultRepository: VaultRepositoryService,
    private _env: EnvironmentsService,
    private _cirrusApi: CirrusApiService
  ) { }

  async getVault(): Promise<Vault> {
    const hydrated = await firstValueFrom(this.getHydratedVault());
    return new Vault(this._env.contracts.vault, hydrated);
  }

  async getProposal(proposalId: number): Promise<VaultProposal> {
    const entity = await this._vaultRepository.getProposalById(proposalId);
    return await this._buildProposal(entity);
  }

  async getProposals(skip: number, take: number): Promise<IPagination<VaultProposal>> {
    const result = await this._vaultRepository.getProposals(skip, take);
    const proposals = await Promise.all(result.results.map(entity => this._buildProposal(entity)));
    return { skip: result.skip, take: result.take, results: proposals, count: result.count };
  }

  async getCertificates(): Promise<VaultCertificate[]> {
    const entities = await this._vaultRepository.getCertificates();
    return entities.map(entity => new VaultCertificate(entity));
  }

  public pledgeQuote() { }
  public withdrawPledgeQuote() { }
  public voteQuote() { }
  public withdrawVoteQuote() { }
  public redeemCertificateQuote() { }
  public completeProposalQuote() { }
  public createCertificateProposalQuote() { }
  public createRevokeCertificateProposalQuote() { }
  public createMinimumPledgeProposalQuote() { }
  public createMinimumVoteProposalQuote() { }

  private async _buildProposal(entity: IVaultProposalEntity): Promise<VaultProposal> {
    const hydrated = await firstValueFrom(this.getHydratedProposal(entity.proposalId));
    return new VaultProposal(this._env.contracts.vault, this._env.contracts.odx, entity, hydrated);
  }

  getHydratedVault(): Observable<IHydratedVault> {
    const vault = this._env.contracts.vault;
    const balanceRequest = new LocalCallRequest(this._env.contracts.odx, 'GetBalance', this._env.contracts.vault, [new Parameter(ParameterType.Address, this._env.contracts.vault)]);

    const properties = [
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.Token, ParameterType.Address),
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.TotalSupply, ParameterType.UInt256),
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.VestingDuration, ParameterType.ULong),
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.TotalProposedAmount, ParameterType.UInt256),
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.TotalPledgeMinimum, ParameterType.ULong),
      this._cirrusApi.getContractStorageItem(vault, VaultStateKeys.TotalVoteMinimum, ParameterType.ULong),
      this._cirrusApi.localCall(balanceRequest).pipe(map(response => response.return), catchError(_ => of('0')))
    ];

    return zip(properties)
      .pipe(
        map(([token, totalSupply, vestingDuration, totalProposedAmount, totalPledgeMinimum, totalVoteMinimum, balance]) => {
          return {
            token,
            totalSupply: BigInt(totalSupply),
            vestingDuration: parseFloat(vestingDuration),
            totalProposedAmount: BigInt(totalProposedAmount),
            totalPledgeMinimum: BigInt(totalPledgeMinimum),
            totalVoteMinimum: BigInt(totalVoteMinimum),
            balance: BigInt(balance)
          };
        }));
  }

  getHydratedProposal(proposalId: number): Observable<IHydratedProposal> {
    const vault = this._env.contracts.vault;
    const request = new LocalCallRequest(vault, 'GetProposal', vault, [new Parameter(ParameterType.ULong, proposalId)])
    return this._cirrusApi.localCall(request).pipe(map(response => response.return));
  }

  getCreatedVaultProposals(fromBlock: number = 3500000): Observable<any> {
    const logType = TransactionLogTypes.CreateVaultProposalLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getCompletedVaultProposals(fromBlock: number = 3500000): Observable<any> {
    const logType = TransactionLogTypes.CompleteVaultProposalLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getCreatedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const logType = TransactionLogTypes.CreateVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getRevokedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const logType = TransactionLogTypes.RevokeVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getRedeemedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const logType = TransactionLogTypes.RedeemVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  private _searchReceipt$(request: ReceiptSearchRequest, logType: TransactionLogTypes): Observable<any> {
    return this._cirrusApi.searchContractReceipts(request)
      .pipe(
        map(response => {
          const logs = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === logType)
              .forEach(log => logs.push({...log.log.data, blockHeight: tx.blockNumber, from: tx.from,}));
          });

          return logs;
      }));
  }
}
