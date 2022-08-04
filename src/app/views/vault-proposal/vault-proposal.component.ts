import { WalletService } from '@services/platform/wallet.service';
import { NodeService } from '@services/platform/node.service';
import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ActivatedRoute } from '@angular/router';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { Icons } from '@enums/icons';
import { Vault } from '@models/platform/vault';
import { VaultProposal } from '@models/platform/vault-proposal';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';
import { TokenService } from '@services/platform/token.service';
import { Subscription, tap, switchMap } from 'rxjs';
import { StatCardInfo } from '../vault/vault.component';
import { VaultService } from '@services/platform/vault.service';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-vault-proposal',
  templateUrl: './vault-proposal.component.html',
  styleUrls: ['./vault-proposal.component.scss']
})
export class VaultProposalComponent {
  subscription: Subscription = new Subscription();
  vault: Vault;
  token: Token;
  latestBlock: number;
  proposal: VaultProposal;
  context: UserContext;
  userVote:  { balance: FixedDecimal; inFavor: boolean };
  userPledge: FixedDecimal;
  pledgePercentage: FixedDecimal;
  icons = Icons;

  constructor(
    private _vaultService: VaultService,
    private _tokensService: TokenService,
    private _nodeService: NodeService,
    private _route: ActivatedRoute,
    private _userContextService: UserContextService,
    private _bottomSheet: MatBottomSheet,
    private _walletService: WalletService
  ) {
    const proposalId = parseInt(this._route.snapshot.paramMap.get('proposalId'));

    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(
          tap(block => this.latestBlock = block),
          switchMap(_ => this.getVault()),
          switchMap(_ => this.getProposal(proposalId)),
          switchMap(_ => this.getVote()),
          switchMap(_ => this.getPledge()))
        .subscribe());
  }

  async getProposal(proposalId: number): Promise<void> {
    this.proposal = await this._vaultService.getProposal(proposalId);
    this.setPledgePercentage();
  }

  async getVault(): Promise<Vault> {
    const vault = await this._vaultService.getVault();
    const token = await this._tokensService.buildToken(vault.token);

    this.vault = vault;
    this.token = token;

    return vault;
  }

  async getVote(): Promise<FixedDecimal> {
    if (this.proposal.status === 'Pledge' || !!this.context?.wallet === false) return null;

    try {
      const response = await this._walletService.getVaultVotePosition(this.proposal.proposalId, this.context.wallet);
      const fixed = FixedDecimal.FromBigInt(response.balance, 8); // CRS 8 decimals
      this.userVote = {balance: fixed, inFavor: response.inFavor};
      return fixed;
    } catch {
      return null;
    }
  }

  async getPledge(): Promise<FixedDecimal> {
    if (!!this.context?.wallet === false) return null;

    try {
      const bigInt = await this._walletService.getVaultPledgePosition(this.proposal.proposalId, this.context.wallet);
      const fixed = FixedDecimal.FromBigInt(bigInt, 8); // CRS 8 decimals
      this.userPledge = fixed;
      return fixed;
    } catch {
      return null;
    }
  }

  async quoteCompleteProposal(proposalId: number): Promise<void> {
    if (!this.context?.wallet) return;

    const quote = await this._vaultService.completeProposalQuote(proposalId);

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  openTransactionView(view: string, withdraw: boolean) {
    // this._sidebar.openSidenav(TransactionView.vaultProposal, { child: view, withdraw, proposalId: this.proposal.proposalId });
  }

  proposalsTrackBy(index: number, proposal: VaultProposal) {
    return `${index}-${proposal?.trackBy}`;
  }

  private setPledgePercentage(): void {
    const minimum = this.vault.totalPledgeMinimum;
    const pledge = this.proposal.pledgeAmount;

    this.pledgePercentage = pledge.divide(minimum).multiply(FixedDecimal.OneHundred(0));
  }

  getExpirationPercentage(proposal: VaultProposal) {
    if (proposal.status === 'Complete' || proposal.expiration <= this.latestBlock) return 100;

    const threeDays = 60 * 60 * 24 * 3 / 16;
    const oneWeek = 60 * 60 * 24 * 7 / 16;
    const duration = proposal.status === 'Pledge' ? oneWeek : threeDays;
    const startBlock = proposal.expiration - duration;
    const blocksPassed = this.latestBlock - startBlock;

    return Math.floor((blocksPassed / duration) * 100);
  }

  getVotePercentage(first: FixedDecimal, second: FixedDecimal): FixedDecimal {
    const oneHundred = FixedDecimal.OneHundred(0);

    if (second.bigInt === BigInt(0) && first.bigInt > BigInt(0)) return oneHundred;
    else if (second.bigInt === BigInt(0) && first.bigInt == BigInt(0)) return FixedDecimal.Zero(0);

    return first.divide(second).multiply(oneHundred);
  }

  statCardTrackBy(index: number, statCard: StatCardInfo) {
    return `${index}-${statCard?.title}-${statCard?.value?.formattedValue}`;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
