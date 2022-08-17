import { VaultService } from '@services/platform/vault.service';
import { Component, OnChanges, OnDestroy, Input, Injector, OnInit } from "@angular/core";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { TxBase } from "@components/tx-module/tx-base.component";
import { Icons } from "@enums/icons";
import { PositiveDecimalNumberRegex } from "@lookups/regex.lookup";
import { Token } from "@models/platform/token";
import { VaultProposal } from "@models/platform/vault-proposal";
import { FixedDecimal } from "@models/types/fixed-decimal";
import { TokenService } from "@services/platform/token.service";
import { EnvironmentsService } from "@services/utility/environments.service";
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from "rxjs";
import { TransactionQuote } from '@models/platform/transaction-quote';

@Component({
  selector: 'opdex-tx-vault-proposal-vote',
  templateUrl: './tx-vault-proposal-vote.component.html',
  styleUrls: ['./tx-vault-proposal-vote.component.scss']
})
export class TxVaultProposalVoteComponent extends TxBase implements OnInit, OnChanges, OnDestroy {
  @Input() data: any;
  form: FormGroup;
  icons = Icons;
  isWithdrawal = false;
  percentageSelected: string;
  crs: Token;
  vaultAddress: string;
  positionType: 'Balance' | 'ProposalVote';
  subscription = new Subscription();
  balanceError: boolean;
  proposal: VaultProposal;
  latestBlock: number;
  votingDisabled: string;

  get amount(): FormControl {
    return this.form.get('amount') as FormControl;
  }

  get inFavor(): FormControl {
    return this.form.get('inFavor') as FormControl;
  }

  constructor(
    protected _injector: Injector,
    private _fb: FormBuilder,
    private _vaultService: VaultService,
    private _env: EnvironmentsService,
    private _tokenService: TokenService
  ) {
    super(_injector);

    this.vaultAddress = this._env.contracts.vault;

    this.form = this._fb.group({
      amount: ['', [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]],
      inFavor: [false, Validators.required]
    });

    this.subscription.add(
      this.amount.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(_ => this.validateBalance()))
        .subscribe());

    this.subscription.add(
      this._nodeService.latestBlock$
        .subscribe(block => this.latestBlock = block));
  }

  async ngOnInit(): Promise<void> {
    this.crs = await this._tokenService.buildToken('CRS');
  }

  ngOnChanges() {
    if (!!this.data) {
      const { proposal, withdraw, inFavor } = this.data;

      this.inFavor.setValue(!!inFavor);
      this.isWithdrawal = !!withdraw;
      this.positionType = this.isWithdrawal ? 'ProposalVote' : 'Balance';

      if (proposal) this._setProposal(proposal);
    }
  }

  async submit(): Promise<void> {
    if (!this.vaultAddress || !this.context.isLoggedIn) return;

    const amount = new FixedDecimal(this.amount.value, this.crs.decimals);

    try {
      const quote: TransactionQuote = !this.isWithdrawal
        ? await this._vaultService.voteQuote(this.proposal.proposalId, amount, this.inFavor.value)
        : await this._vaultService.withdrawVoteQuote(this.proposal.proposalId, amount);

      this.quote(quote);
    } catch (error) {
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  handleAddRemoveStatus(event: MatSlideToggleChange): void {
    this.isWithdrawal = event.checked;
    this.positionType = this.isWithdrawal ? 'ProposalVote' : 'Balance';

    this._setProposal(this.proposal);
    this.amount.setValue(undefined);
    this.amount.markAsUntouched();
    this.balanceError = false;
  }

  handlePercentageSelect(value: any): void {
    this.percentageSelected = null;
    this.amount.setValue(value.result, {emitEvent: true});
  }

  private async validateBalance(): Promise<boolean> {
    if (!this.amount.value || !this.context?.isLoggedIn || !this.crs) return false;

    const amountNeeded = new FixedDecimal(this.amount.value, this.crs.decimals);

    const result = this.isWithdrawal
      ? await this._validateVaultVote(this.proposal.proposalId, amountNeeded)
      : await this._validateBalance(this.crs, amountNeeded);

    this.balanceError = !result;

    return result;
  }

  private _setProposal(proposal: VaultProposal): void {
    this.proposal = proposal;

    const isNotVotePeriod = proposal.status !== 'Vote';
    const isExpired = proposal.expiration < this.latestBlock;

    if (!this.isWithdrawal && (isNotVotePeriod || isExpired)) {
      this.amount.disable();
      this.votingDisabled = isExpired || proposal.status === 'Complete'
        ? 'Voting period has ended'
        : 'Voting period has not started'
    } else {
      this.amount.enable();
      this.votingDisabled = undefined;
    }
  }

  destroyContext$(): void {
    this.context$.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroyContext$();
    this.subscription.unsubscribe();
  }
}
