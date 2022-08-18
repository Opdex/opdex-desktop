import { TransactionQuote } from '@models/platform/transaction-quote';
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

@Component({
  selector: 'opdex-tx-vault-proposal-pledge',
  templateUrl: './tx-vault-proposal-pledge.component.html',
  styleUrls: ['./tx-vault-proposal-pledge.component.scss']
})
export class TxVaultProposalPledgeComponent extends TxBase implements OnInit, OnChanges, OnDestroy {
  @Input() data;
  form: FormGroup;
  icons = Icons;
  isWithdrawal = false;
  percentageSelected: string;
  crs: Token;
  vaultAddress: string;
  positionType: 'Balance' | 'ProposalPledge';
  subscription = new Subscription();
  balanceError: boolean;
  proposal: VaultProposal;
  latestBlock: number;

  get amount(): FormControl {
    return this.form.get('amount') as FormControl;
  }

  constructor(
    protected _injector: Injector,
    private _fb: FormBuilder,
    private _env: EnvironmentsService,
    private _tokenService: TokenService,
    private _vaultService: VaultService
  ) {
    super(_injector);

    this.vaultAddress = this._env.contracts.vault;

    this.form = this._fb.group({
      amount: ['', [Validators.required, Validators.pattern(PositiveDecimalNumberRegex)]]
    });

    this.subscription.add(
      this.amount.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(_ => this.validateBalance()))
        .subscribe());

    this.subscription.add(
      this._indexerService.latestBlock$
        .subscribe(block => this.latestBlock = block));
  }

  async ngOnInit() {
    this.crs = await this._tokenService.buildToken('CRS');
  }

  ngOnChanges() {
    if (!!this.data) {
      const { proposal, withdraw } = this.data;

      this.isWithdrawal = !!withdraw;
      this.positionType = this.isWithdrawal ? 'ProposalPledge' : 'Balance';

      if (proposal) this._setProposal(proposal);
    }
  }

  async submit(): Promise<void> {
    if (!this.vaultAddress || !this.context.isLoggedIn) return;

    const amount = new FixedDecimal(this.amount.value, this.crs.decimals);

    try {
      const quote: TransactionQuote = !this.isWithdrawal
        ? await this._vaultService.pledgeQuote(this.proposal.proposalId, amount)
        : await this._vaultService.withdrawPledgeQuote(this.proposal.proposalId, amount);

      this.quote(quote);
    } catch (error) {
      this.quoteErrors = ['Unexpected error quoting transaction'];
    }
  }

  handleAddRemoveStatus(event: MatSlideToggleChange): void {
    this.isWithdrawal = event.checked;
    this.positionType = this.isWithdrawal ? 'ProposalPledge' : 'Balance';

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
      ? await this._validateVaultPledge(this.proposal.proposalId, amountNeeded)
      : await this._validateBalance(this.crs, amountNeeded);

    this.balanceError = !result;

    return result;
  }

  private _setProposal(proposal: VaultProposal): void {
    this.proposal = proposal;

    if (!this.isWithdrawal && (proposal.status !== 'Pledge' || proposal.expiration < this.latestBlock)) {
      this.amount.disable();
    } else {
      this.amount.enable();
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
