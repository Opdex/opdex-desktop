import { Injectable } from "@angular/core";
import { ParameterType } from "@enums/parameter-type";
import { Contracts } from "@lookups/contracts.lookup";
import { VaultStateKeys } from "@lookups/state-keys/vault-state-keys";
import { CirrusApiService } from "@services/api/cirrus-api.service";
import { combineLatest, map } from "rxjs";

@Injectable({providedIn: 'root'})
export class VaultService {
  constructor(private _cirrus: CirrusApiService) { }

  getHydratedVault() {
    const vault = Contracts.mainnet.vault;

    const properties = [
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.token, ParameterType.Address),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.totalSupply, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.vestingDuration, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.totalProposedAmount, ParameterType.UInt256),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.totalPledgeMinimum, ParameterType.ULong),
      this._cirrus.getContractStorageItem(vault, VaultStateKeys.totalVoteMinimum, ParameterType.ULong),
    ];

    return combineLatest(properties)
      .pipe(
        map(([token, totalSupply, vestingDuration, totalProposedAmount, totalPledgeMinimum, totalVoteMinimum]) => {
          return { token, totalSupply, vestingDuration, totalProposedAmount, totalPledgeMinimum, totalVoteMinimum };
        }));
  }
}
