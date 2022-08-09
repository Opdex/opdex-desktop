import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { WalletService } from '@services/platform/wallet.service';
import { UserContextService } from '@services/utility/user-context.service';
import { UserContext } from '@models/user-context';
import { VaultService } from '@services/platform/vault.service';
import { NodeService } from '@services/platform/node.service';
import { Component, OnDestroy, Inject } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Icons } from '@enums/icons';
import { PositiveDecimalNumberRegex } from '@lookups/regex.lookup';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { Subscription, switchMap } from 'rxjs';
import { TransactionQuote } from '@models/platform/transaction-quote';
import { ReviewQuoteComponent } from '@components/tx-module/shared/review-quote/review-quote.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'opdex-create-proposal-modal',
  templateUrl: './create-proposal-modal.component.html',
  styleUrls: ['./create-proposal-modal.component.scss']
})
export class CreateProposalModalComponent implements OnDestroy {
  form: FormGroup;
  icons = Icons;
  balanceError: boolean;
  quoteErrors: string[];
  context: UserContext;
  subscription = new Subscription();
  proposalTypes = [
    {
      label: 'Create Certificate',
      value: 1
    },
    {
      label: 'Revoke Certificate',
      value: 2
    },
    {
      label: 'Minimum Pledge',
      value: 3
    },
    {
      label: 'Minimum Vote',
      value: 4
    }
  ];

  get deposit(): FormControl {
    return this.form.get('deposit') as FormControl;
  }

  get amount(): FormControl {
    return this.form.get('amount') as FormControl;
  }

  get type(): FormControl {
    return this.form.get('type') as FormControl;
  }

  get description(): FormControl {
    return this.form.get('description') as FormControl;
  }

  get recipient(): FormControl {
    return this.form.get('recipient') as FormControl;
  }

  constructor(
    private _fb: FormBuilder,
    private _nodeService: NodeService,
    private _vaultService: VaultService,
    private _contextService: UserContextService,
    private _walletService: WalletService,
    private _bottomSheet: MatBottomSheet,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this._fb.group({
      type: [1, [Validators.required]],
      deposit: [{value: '500', disabled: true}, [Validators.required]],
      description: ['', [Validators.required]],
      amount: ['', [Validators.pattern(PositiveDecimalNumberRegex)]],
      recipient: ['']
    });

    this.subscription.add(
      this._contextService.context$
        .subscribe(context => this.context = context));

    this.subscription.add(
      this._nodeService.latestBlock$
        .pipe(switchMap(_ => this._validateBalance()))
        .subscribe());

    if (this.data?.form) this.form.patchValue(this.data.form);
  }

  async submit(): Promise<void> {
    this.quoteErrors = [];

    const recipient = this.recipient?.value;
    const amount = new FixedDecimal(this.amount?.value || '0', 8);
    const description = this.description.value;
    const type = this.type.value;
    let quote: TransactionQuote;

    try {
      if (type === 1) {
        if (amount.bigInt > new FixedDecimal('5000000', 8).bigInt) {
          this.quoteErrors = ['Maximum amount is 5 million.'];
          return;
        }

        quote = await this._vaultService.createCertificateProposalQuote(amount, recipient, description);
      } else if (type === 2) {
        quote = await this._vaultService.createRevokeCertificateProposalQuote(recipient, description);
      } else if (type === 3) {
        quote = await this._vaultService.createMinimumPledgeProposalQuote(amount, description);
      } else if (type === 4) {
        quote = await this._vaultService.createMinimumVoteProposalQuote(amount, description);
      } else {
        this.quoteErrors = ['Invalid proposal type'];
        return;
      }
    } catch (error) {
      console.log(error);
      this.quoteErrors = ['Unexpected error creating proposal quote.'];
      return;
    }

    this._bottomSheet.open(ReviewQuoteComponent, { data: quote });
  }

  private async _validateBalance(): Promise<boolean> {
    if (!this.context?.wallet) return false;

    const amountNeeded = new FixedDecimal('500', 8);
    const balance = await this._walletService.getBalance('CRS', this.context.wallet.address);
    const isEnough = balance >= amountNeeded.bigInt;

    this.balanceError = !isEnough;

    return isEnough;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
