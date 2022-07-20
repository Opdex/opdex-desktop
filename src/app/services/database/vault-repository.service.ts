import { IVaultProposalEntity, IVaultCertificateEntity } from '@interfaces/database.interface';
import { Injectable } from "@angular/core";
import { OpdexDB } from "./db.service";

@Injectable({providedIn: 'root'})
export class VaultRepositoryService {
  constructor(private _db: OpdexDB) { }

  async getProposalById(proposalId: number): Promise<IVaultProposalEntity> {
    return await this._db.proposal.get(proposalId);
  }

  async getCertificates(): Promise<IVaultCertificateEntity[]> {
    return await this._db.certificate.toArray();
  }

  async getCertificateByOwner(owner: string): Promise<IVaultCertificateEntity> {
    return await this._db.certificate.get({owner});
  }

  async getCertificateByVestedBlock(vestedBlock: number): Promise<IVaultCertificateEntity> {
    return await this._db.certificate.get({vestedBlock});
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

  // Todo: Link to proposalId
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
    const entity = await this.getCertificateByVestedBlock(vestedBlock);
    entity.redeemed = 1;
    await this._db.certificate.put(entity);
  }

  async setCertificateRevocation(vestedBlock: number, newAmount: BigInt): Promise<void> {
    const entity = await this.getCertificateByVestedBlock(vestedBlock);
    entity.revoked = 1;
    entity.amount = newAmount;
    await this._db.certificate.put(entity);
  }
}
