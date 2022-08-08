import { tap } from 'rxjs/operators';
import { WalletService } from '@services/platform/wallet.service';
import { UserContextService } from '@services/utility/user-context.service';
import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FixedDecimal } from '@models/types/fixed-decimal';
import { UserContext } from '@models/user-context';
import { Token } from '@models/platform/token';
import { NodeService } from '@services/platform/node.service';

@Component({
  selector: 'opdex-percentage-amount-buttons',
  templateUrl: './percentage-amount-buttons.component.html',
  styleUrls: ['./percentage-amount-buttons.component.scss']
})
export class PercentageAmountButtonsComponent implements OnChanges {
  @Input() contract: string; // The Mining/Liquidity/Token where the balance would be checked
  @Input() token: Token;
  @Input() positionType: 'Balance' | 'Staking' | 'Mining' | 'ProposalVote' | 'ProposalPledge';
  @Input() selected: string;
  @Input() proposalId: number;
  @Input() disable: boolean;
  @Output() onPercentageSelect = new EventEmitter<any>();

  contextSubscription = new Subscription();
  positionSubscription = new Subscription();
  context: UserContext;
  balance: FixedDecimal;
  percentages: string[] = [ '25', '50', '75', '100' ];

  constructor(
    private _userContextService: UserContextService,
    private _nodeService: NodeService,
    private _walletService: WalletService
  ) {
    this.contextSubscription.add(
      this._userContextService.context$
        .pipe(tap(context => this.context = context))
        .subscribe(_ => this.ngOnChanges()));
  }

  async ngOnChanges(): Promise<void> {
    if (this.context?.wallet && this.positionType && this.token && this.contract) {
      let balance$: Promise<BigInt>;

      if (this.positionType === 'Balance') {
        balance$ = this._walletService.getBalance(this.contract, this.context.wallet);
      }
      else if (this.positionType === 'Staking') {
        balance$ = this._walletService.getStakingPosition(this.contract, this.context.wallet);
      }
      else if (this.positionType === 'Mining') {
        balance$ = this._walletService.getMiningPosition(this.contract, this.context.wallet);
      }
      else if (this.positionType === 'ProposalVote' && this.proposalId > 0) {
        balance$ = this._getVaultVote();
      }
      else if (this.positionType === 'ProposalPledge' && this.proposalId > 0) {
        balance$ = this._walletService.getVaultPledgePosition(this.proposalId, this.context.wallet);
      }
      else {
        balance$ = new Promise(() => BigInt('0'));
      }

      if (this.positionSubscription && !this.positionSubscription.closed) {
        this.positionSubscription.unsubscribe();
        this.positionSubscription = new Subscription();
      }

      this.positionSubscription.add(
        this._nodeService.latestBlock$
          .pipe(switchMap(_ => balance$))
          .subscribe(result => this.balance = FixedDecimal.FromBigInt(result, this.token.decimals)));
    }
  }

  private async _getVaultVote(): Promise<BigInt> {
    const response = await this._walletService.getVaultVotePosition(this.proposalId, this.context.wallet);
    return response.balance;
  }

  selectPercentage(value: string) {
    if (!this.balance) return;

    console.log(this.balance)

    const formattedValue = value === '100' ? '1.00' : `0.${value}`;
    const result = this.balance.multiply(new FixedDecimal(formattedValue, 2));

    this.onPercentageSelect.emit({result: result.formattedValue, percentageOption: value});
  }

  ngOnDestroy(): void {
    this.contextSubscription.unsubscribe();
    this.positionSubscription.unsubscribe();
  }
}
