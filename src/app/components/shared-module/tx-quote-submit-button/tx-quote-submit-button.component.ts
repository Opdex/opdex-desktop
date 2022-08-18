import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Icons } from 'src/app/enums/icons';
import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UserContext } from '@models/user-context';
import { UserContextService } from '@services/utility/user-context.service';

@Component({
  selector: 'opdex-tx-quote-submit-button',
  templateUrl: './tx-quote-submit-button.component.html',
  styleUrls: ['./tx-quote-submit-button.component.scss']
})
export class TxQuoteSubmitButtonComponent implements OnDestroy {
  @Input() label: string = 'Quote';
  @Input() disabled: boolean;
  @Input() warn: boolean;
  @Input() size: string;
  @Output() onSubmit = new EventEmitter();
  context: UserContext;
  icons = Icons;
  subscription = new Subscription();

  constructor(
    private _userContextService: UserContextService,
    private _router: Router
  ) {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  login(): void {
    this._router.navigateByUrl('/login');
  }

  submit(): void {
    this.onSubmit.emit();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
