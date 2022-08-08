import { UserContextService } from '@services/utility/user-context.service';
import { VaultMethods } from '@enums/contracts/methods/vault-methods';
import { FixedDecimal } from '@models/types/fixed-decimal';
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
import { TransactionQuote } from '@models/platform/transaction-quote';
import { IHydratedVault, IHydratedProposal } from '@interfaces/contract-properties.interface';

@Injectable({providedIn: 'root'})
export class VaultService {
  private _vault: string;

  constructor(
    private _vaultRepository: VaultRepositoryService,
    private _env: EnvironmentsService,
    private _cirrusApi: CirrusApiService,
    private _context: UserContextService
  ) {
    this._vault = this._env.contracts.vault;
  }

  async getVault(): Promise<Vault> {
    const hydrated = await firstValueFrom(this.getHydratedVault());
    return new Vault(this._vault, hydrated);
  }

  async getProposal(proposalId: number): Promise<VaultProposal> {
    const entity = await this._vaultRepository.getProposalById(proposalId);
    if (!entity) return undefined;
    return await this._buildProposal(entity);
  }

  async getProposals(skip: number, take: number): Promise<IPagination<VaultProposal>> {
    const result = await this._vaultRepository.getProposals(skip, take);
    const proposals = await Promise.all(result.results.map(entity => this._buildProposal(entity)));
    return { skip: result.skip, take: result.take, results: proposals, count: result.count };
  }

  async getCertificates(skip: number, take: number): Promise<IPagination<VaultCertificate>> {
    const result = await this._vaultRepository.getCertificates(skip, take);
    const certificates = result.results.map(entity => new VaultCertificate(entity));
    return { skip: result.skip, take: result.take, results: certificates, count: result.count };
  }

  public async pledgeQuote(proposalId: number, amount: FixedDecimal): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void Pledge(ulong proposalId);
    const request = new LocalCallRequest(this._vault, VaultMethods.Pledge, wallet, [
      new Parameter(ParameterType.ULong, proposalId, 'Proposal No.')
    ], amount.formattedValue);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async withdrawPledgeQuote(proposalId: number, amount: FixedDecimal): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void WithdrawPledge(ulong proposalId, ulong withdrawAmount);
    const request = new LocalCallRequest(this._vault, VaultMethods.WithdrawPledge, wallet, [
      new Parameter(ParameterType.ULong, proposalId, 'Proposal No.'),
      new Parameter(ParameterType.ULong, amount.bigInt.toString(), 'Withdraw Amount')
    ]);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async voteQuote(proposalId: number, amount: FixedDecimal, inFavor: boolean): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void Vote(ulong proposalId, bool inFavor);
    const request = new LocalCallRequest(this._vault, VaultMethods.Vote, wallet, [
      new Parameter(ParameterType.ULong, proposalId, 'Proposal No.'),
      new Parameter(ParameterType.ULong, inFavor.toString(), 'In Favor')
    ], amount.formattedValue);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async withdrawVoteQuote(proposalId: number, amount: FixedDecimal): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void WithdrawVote(ulong proposalId, ulong withdrawAmount);
    const request = new LocalCallRequest(this._vault, VaultMethods.WithdrawVote, wallet, [
      new Parameter(ParameterType.ULong, proposalId, 'Proposal No.'),
      new Parameter(ParameterType.ULong, amount.bigInt.toString(), 'Withdraw Amount')
    ]);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async redeemCertificateQuote(): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void RedeemCertificate();
    const request = new LocalCallRequest(this._vault, VaultMethods.RedeemCertificate, wallet);
    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async completeProposalQuote(proposalId: number): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;

    // void CompleteProposal(ulong proposalId);
    const request = new LocalCallRequest(this._vault, VaultMethods.CompleteProposal, wallet, [
      new Parameter(ParameterType.ULong, proposalId, 'Proposal No.')
    ]);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async createCertificateProposalQuote(amount: FixedDecimal, recipient: string, description: string): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;
    const deposit = new FixedDecimal('500', 8).formattedValue;

    // ulong CreateNewCertificateProposal(UInt256 amount, Address recipient, string description);
    const request = new LocalCallRequest(this._vault, VaultMethods.CreateNewCertificateProposal, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount'),
      new Parameter(ParameterType.Address, recipient, 'Recipient'),
      new Parameter(ParameterType.String, description, 'Description'),
    ], deposit);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async createRevokeCertificateProposalQuote(recipient: string, description: string): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;
    const deposit = new FixedDecimal('500', 8).formattedValue;

    // ulong CreateRevokeCertificateProposal(Address recipient, string description);
    const request = new LocalCallRequest(this._vault, VaultMethods.CreateRevokeCertificateProposal, wallet, [
      new Parameter(ParameterType.Address, recipient, 'Recipient'),
      new Parameter(ParameterType.String, description, 'Description'),
    ], deposit);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async createMinimumPledgeProposalQuote(amount: FixedDecimal, description: string): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;
    const deposit = new FixedDecimal('500', 8).formattedValue;

    // ulong CreateTotalPledgeMinimumProposal(UInt256 amount, string description);
    const request = new LocalCallRequest(this._vault, VaultMethods.CreateTotalPledgeMinimumProposal, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount'),
      new Parameter(ParameterType.String, description, 'Description'),
    ], deposit);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  public async createMinimumVoteProposalQuote(amount: FixedDecimal, description: string): Promise<TransactionQuote> {
    const {wallet} = this._context.userContext;
    const deposit = new FixedDecimal('500', 8).formattedValue;

    // ulong CreateTotalVoteMinimumProposal(UInt256 amount, string description);
    const request = new LocalCallRequest(this._vault, VaultMethods.CreateTotalVoteMinimumProposal, wallet, [
      new Parameter(ParameterType.UInt256, amount.bigInt.toString(), 'Amount'),
      new Parameter(ParameterType.String, description, 'Description'),
    ], deposit);

    const response = await firstValueFrom(this._cirrusApi.localCall(request));
    return new TransactionQuote(request, response);
  }

  private async _buildProposal(entity: IVaultProposalEntity): Promise<VaultProposal> {
    const hydrated = await firstValueFrom(this.getHydratedProposal(entity.proposalId));
    return new VaultProposal(this._vault, this._env.contracts.odx, entity, hydrated);
  }

  getHydratedVault(): Observable<IHydratedVault> {
    const vault = this._vault;
    const balanceRequest = new LocalCallRequest(this._env.contracts.odx, 'GetBalance', this._vault, [new Parameter(ParameterType.Address, this._vault)]);

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
    const vault = this._vault;
    const request = new LocalCallRequest(vault, VaultMethods.GetProposal, vault, [new Parameter(ParameterType.ULong, proposalId)])
    return this._cirrusApi.localCall(request).pipe(map(response => response.return));
  }

  getCreatedVaultProposals(fromBlock: number): Observable<any> {
    const logType = TransactionLogTypes.CreateVaultProposalLog;
    const request = new ReceiptSearchRequest(this._vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getCompletedVaultProposals(fromBlock: number): Observable<any> {
    const logType = TransactionLogTypes.CompleteVaultProposalLog;
    const request = new ReceiptSearchRequest(this._vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getCreatedVaultCertificates(fromBlock: number): Observable<any> {
    const logType = TransactionLogTypes.CreateVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getRevokedVaultCertificates(fromBlock: number): Observable<any> {
    const logType = TransactionLogTypes.RevokeVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._vault, fromBlock, logType);
    return this._searchReceipt$(request, logType);
  }

  getRedeemedVaultCertificates(fromBlock: number): Observable<any> {
    const logType = TransactionLogTypes.RedeemVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._vault, fromBlock, logType);
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
