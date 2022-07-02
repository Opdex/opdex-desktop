export enum VaultMethods {
  GetCertificate = 'GetCertificate',
  GetProposal = 'GetProposal',
  GetProposalVote = 'GetProposalVote',
  GetProposalPledge = 'GetProposalPledge',
  GetCertificateProposalIdByRecipient = 'GetCertificateProposalIdByRecipient',
  NotifyDistribution = 'NotifyDistribution',
  RedeemCertificate = 'RedeemCertificate',
  CreateNewCertificateProposal = 'CreateNewCertificateProposal',
  CreateRevokeCertificateProposal = 'CreateRevokeCertificateProposal',
  CreateTotalPledgeMinimumProposal = 'CreateTotalPledgeMinimumProposal',
  CreateTotalVoteMinimumProposal = 'CreateTotalVoteMinimumProposal',
  Pledge = 'Pledge',
  Vote = 'Vote',
  WithdrawPledge = 'WithdrawPledge',
  WithdrawVote = 'WithdrawVote',
  CompleteProposal = 'CompleteProposal'
}
