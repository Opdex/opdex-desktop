import { EnvironmentsService } from '@services/utility/environments.service';
import { VaultRepositoryService } from '@services/database/vault-repository.service';
import { VaultApiService } from '@services/api/smart-contracts/vault-api.service';
import { Injectable } from "@angular/core";
import { Vault } from '@models/platform/vault';
import { firstValueFrom } from 'rxjs';
import { VaultCertificate } from '@models/platform/vault-certificate';
import { VaultProposal } from '@models/platform/vault-proposal';
import { IPagination, IVaultProposalEntity } from '@interfaces/database.interface';

@Injectable({providedIn: 'root'})
export class VaultService {
  constructor(
    private _vaultApi: VaultApiService,
    private _vaultRepository: VaultRepositoryService,
    private _env: EnvironmentsService
  ) { }

  async getVault(): Promise<Vault> {
    const hydrated = await firstValueFrom(this._vaultApi.getHydratedVault());
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

  private async _buildProposal(entity: IVaultProposalEntity): Promise<VaultProposal> {
    const hydrated = await firstValueFrom(this._vaultApi.getHydratedProposal(entity.proposalId));
    return new VaultProposal(this._env.contracts.vault, this._env.contracts.odx, entity, hydrated);
  }
}
