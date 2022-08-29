import { TransactionLogTypes } from '@enums/contracts/transaction-log-types';
import { TransactionView } from '@enums/transaction-view';
import { Icons } from "../enums/icons";

export interface ITransactionType {
  eventPriority: number;
  viewSortOrder?: number;
  title: string,
  view?: TransactionView,
  viewRequiresAuth: boolean;
  icon: Icons,
  iconColor: string,
  targetEvents: TransactionLogTypes[];
}

export const TransactionTypes: ITransactionType[] = [
  {
    eventPriority: 0,
    viewSortOrder: 0,
    title: 'Swap',
    view: TransactionView.swap,
    viewRequiresAuth: false,
    icon: Icons.swap,
    iconColor: 'swap',
    targetEvents: [TransactionLogTypes.SwapLog]
  },
  {
    eventPriority: 1,
    viewSortOrder: 2,
    title: 'Stake',
    view: TransactionView.stake,
    viewRequiresAuth: false,
    icon: Icons.staking,
    iconColor: 'stake',
    targetEvents: [
      TransactionLogTypes.StartStakingLog,
      TransactionLogTypes.StopStakingLog,
      TransactionLogTypes.CollectStakingRewardsLog,
      TransactionLogTypes.NominationLog
    ]
  },
  {
    eventPriority: 2,
    viewSortOrder: 1,
    title: 'Provide',
    view: TransactionView.provide,
    viewRequiresAuth: false,
    icon: Icons.provide,
    iconColor: 'provide',
    targetEvents: [
      TransactionLogTypes.MintLog,
      TransactionLogTypes.BurnLog
    ]
  },
  {
    eventPriority: 3,
    viewSortOrder: 3,
    title: 'Mine',
    view: TransactionView.mine,
    viewRequiresAuth: false,
    icon: Icons.mining,
    iconColor: 'mine',
    targetEvents: [
      TransactionLogTypes.StartMiningLog,
      TransactionLogTypes.StopMiningLog,
      TransactionLogTypes.CollectMiningRewardsLog
    ]
  },
  {
    eventPriority: 4,
    viewSortOrder: 4,
    title: 'Create Pool',
    view: TransactionView.createPool,
    viewRequiresAuth: true,
    icon: Icons.liquidityPool,
    iconColor: 'swap',
    targetEvents: [TransactionLogTypes.CreateLiquidityPoolLog]
  },
  {
    eventPriority: 5,
    title: 'Enable Mining',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.refresh,
    iconColor: 'mine',
    targetEvents: [
      TransactionLogTypes.RewardMiningPoolLog,
      TransactionLogTypes.EnableMiningLog
    ]
  },
  {
    eventPriority: 6,
    title: 'Distribute',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.tokens,
    iconColor: 'primary',
    targetEvents: [TransactionLogTypes.DistributionLog]
  },
  {
    eventPriority: 7,
    viewSortOrder: 5,
    title: 'Vault Proposal',
    view: TransactionView.vaultProposal,
    viewRequiresAuth: true,
    icon: Icons.proposal,
    iconColor: 'stake',
    targetEvents: [
      TransactionLogTypes.CreateVaultProposalLog,
      TransactionLogTypes.CompleteVaultProposalLog,
      TransactionLogTypes.VaultProposalPledgeLog,
      TransactionLogTypes.VaultProposalWithdrawPledgeLog,
      TransactionLogTypes.VaultProposalVoteLog,
      TransactionLogTypes.VaultProposalWithdrawVoteLog
    ]
  },
  {
    eventPriority: 8,
    title: 'Vault Certificate',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.receipt,
    iconColor: 'stake',
    targetEvents: [
      TransactionLogTypes.CreateVaultCertificateLog,
      TransactionLogTypes.RevokeVaultCertificateLog,
      TransactionLogTypes.RedeemVaultCertificateLog
    ]
  },
  {
    eventPriority: 9,
    title: 'Ownership',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.owner,
    iconColor: 'swap',
    targetEvents: [
      TransactionLogTypes.SetPendingDeployerOwnershipLog,
      TransactionLogTypes.SetPendingMarketOwnershipLog,
      TransactionLogTypes.ClaimPendingDeployerOwnershipLog,
      TransactionLogTypes.ClaimPendingMarketOwnershipLog,
      // TransactionLogTypes.SetInterfluxCustodianLog
    ]
  },
  {
    eventPriority: 10,
    title: 'Permissions',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.permissions,
    iconColor: 'primary',
    targetEvents: [TransactionLogTypes.ChangeMarketPermissionLog]
  },
  {
    eventPriority: 11,
    viewSortOrder: 6,
    title: 'Allowance',
    view: TransactionView.allowance,
    viewRequiresAuth: true,
    icon: Icons.approve,
    iconColor: 'provide',
    targetEvents: [TransactionLogTypes.ApprovalLog]
  },
  {
    eventPriority: 12,
    title: 'Transfer',
    view: null,
    viewRequiresAuth: true,
    icon: Icons.transfer,
    iconColor: 'primary',
    targetEvents: [TransactionLogTypes.TransferLog]
  }
]
