import { ICompleteVaultProposalLog } from '@interfaces/contract-logs.interface';
import { IVaultProposalEntity, IVaultCertificateEntity, IPagination } from '@interfaces/database.interface';
import { Injectable } from "@angular/core";
import { OpdexDB } from "./db.service";

@Injectable({providedIn: 'root'})
export class VaultRepositoryService {
  constructor(private _db: OpdexDB) { }

  async getProposalById(proposalId: number): Promise<IVaultProposalEntity> {
    return await this._db.proposal.get(proposalId);
  }

  async getProposals(skip: number = 0, take: number = 10): Promise<IPagination<IVaultProposalEntity>> {
    const count = await this._db.proposal.count();
    const results = await this._db.proposal.offset(skip).limit(take).reverse().toArray();
    return { skip, take, count, results };
  }

  async getCertificates(skip: number = 0, take: number = 4): Promise<IPagination<IVaultCertificateEntity>> {
    const count = await this._db.certificate.count();
    const results = await this._db.certificate.toArray();
    return { skip, take, count, results };
  }

  async getCertificatesByOwner(owner: string): Promise<IVaultCertificateEntity[]> {
    return await this._db.certificate.where({owner}).toArray();
  }

  async getCertificateByProposalId(proposalId: number): Promise<IVaultCertificateEntity> {
    return await this._db.certificate.get({proposalId});
  }

  private async _getCertificateByVestedBlock(vestedBlock: number): Promise<IVaultCertificateEntity> {
    return await this._db.certificate.get({vestedBlock});
  }

  async setCompletedProposals(completeLogs: ICompleteVaultProposalLog[]): Promise<void> {
    const proposals = await this._db.proposal.where('proposalId').anyOf(completeLogs.map(log => log.proposalId)).toArray();

    this._db.proposal.bulkPut(proposals.map(proposal => {
      proposal.approved = completeLogs.find(log => log.proposalId === proposal.proposalId).approved ? 1 : 0;
      return proposal;
    }));
  }

  async persistProposals(proposals: IVaultProposalEntity[]): Promise<void> {
    const proposalIds = proposals.map(proposal => proposal.proposalId);

    const entities = await this._db.proposal
      .where('proposalId')
      .anyOf(proposalIds)
      .toArray();

    await this._db.proposal.bulkPut(proposals.map(proposal => {
      return {
        ...proposal,
        id: entities.find(entity => entity.proposalId === proposal.proposalId)?.id
      }
    }));
  }

  async persistCertificates(certificates: IVaultCertificateEntity[]): Promise<void> {
    const certificateIds = certificates.map(certificate => certificate.id);

    const entities = await this._db.certificate
      .where('id')
      .anyOf(certificateIds)
      .toArray();

    await this._db.certificate.bulkPut(certificates.map(certificate => {
      return {
        ...certificate,
        id: entities.find(entity => entity.id === certificate.id)?.id
      }
    }));
  }

  async setCertificateRedemption(vestedBlock: number): Promise<void> {
    const entity = await this._getCertificateByVestedBlock(vestedBlock);
    entity.redeemed = 1;
    await this._db.certificate.put(entity);
  }

  async setCertificateRevocation(vestedBlock: number, newAmount: BigInt): Promise<void> {
    const entity = await this._getCertificateByVestedBlock(vestedBlock);
    entity.revoked = 1;
    entity.amount = newAmount;
    await this._db.certificate.put(entity);
  }
}
