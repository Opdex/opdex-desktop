import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { VaultStateKeys } from "@enums/contracts/state-keys/vault-state-keys";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { EnvironmentsService } from "@services/utility/environments.service";
import { zip, map, Observable, catchError, of } from "rxjs";
import { TransactionLogTypes } from "@enums/contracts/transaction-log-types";
import { ReceiptSearchRequest } from "@models/cirrusApi/requests/receipt-search.request";
import { LocalCallPayload } from "@models/cirrusApi/contract-calls/local-call";
import { Parameter } from "@models/cirrusApi/contract-calls/parameter";

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
    private _cirrus: CirrusApiService,
    private _env: EnvironmentsService
  ) { }

  getHydratedVault(): Observable<IHydratedVault> {
    const vault = this._env.contracts.vault;
    const balanceRequest = new LocalCallPayload(this._env.contracts.odx, 'GetBalance', this._env.contracts.vault, [new Parameter(ParameterType.Address, this._env.contracts.vault)]);

    const properties = [
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.Token, ParameterType.Address),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.VestingDuration, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalProposedAmount, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalPledgeMinimum, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.TotalVoteMinimum, ParameterType.ULong),
      this._cirrus.localCall(balanceRequest).pipe(map(response => response.return), catchError(_ => of('0')))
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
    const request = new LocalCallPayload(vault, 'GetProposal', vault, [new Parameter(ParameterType.ULong, proposalId)])
    return this._cirrus.localCall(request).pipe(map(response => response.return));
  }

  getCreatedVaultProposals(fromBlock: number = 3500000): Observable<any> {
    const createProposalLog = TransactionLogTypes.CreateVaultProposalLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, createProposalLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const proposals = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createProposalLog)
              .forEach(log => proposals.push({...log.log.data, creator: tx.from, blockHeight: tx.blockNumber}));
          });

          console.log(proposals)

          return proposals;
      }));
  }

  getCompletedVaultProposals(fromBlock: number = 3500000): Observable<any> {
    const completeProposalLog = TransactionLogTypes.CompleteVaultProposalLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, completeProposalLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const proposals = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === completeProposalLog)
              .forEach(log => proposals.push({...log.log.data, blockHeight: tx.blockNumber}));
          });

          console.log(proposals)

          return proposals;
      }));
  }

  getCreatedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const createCertificateLog = TransactionLogTypes.CreateVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, createCertificateLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const certificates = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === createCertificateLog)
              .forEach(log => certificates.push({...log.log.data, blockHeight: tx.blockNumber}));
          });

          console.log(certificates)

          return certificates;
      }));
  }

  getRevokedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const revokeCertificateLog = TransactionLogTypes.RevokeVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, revokeCertificateLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const certificates = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === revokeCertificateLog)
              .forEach(log => certificates.push({...log.log.data, blockHeight: tx.blockNumber}));
          });

          console.log(certificates)

          return certificates;
      }));
  }

  getRedeemedVaultCertificates(fromBlock: number = 3500000): Observable<any> {
    const redeemCertificateLog = TransactionLogTypes.RedeemVaultCertificateLog;
    const request = new ReceiptSearchRequest(this._env.contracts.vault, fromBlock, redeemCertificateLog);

    return this._cirrus.searchContractReceipts(request)
      .pipe(
        map(response => {
          const certificates = [];

          response.forEach(tx => {
            tx.logs
              .filter(log => log.log.event === redeemCertificateLog)
              .forEach(log => certificates.push({...log.log.data, blockHeight: tx.blockNumber}));
          });

          console.log(certificates)

          return certificates;
      }));
  }
}
