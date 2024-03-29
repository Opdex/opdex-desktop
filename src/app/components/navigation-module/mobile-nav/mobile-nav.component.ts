import { UserContext } from '@models/user-context';
import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Icons } from 'src/app/enums/icons';
import { Subscription } from 'rxjs';
import { UserContextService } from '@services/utility/user-context.service';

@Component({
  selector: 'opdex-mobile-nav',
  templateUrl: './mobile-nav.component.html',
  styleUrls: ['./mobile-nav.component.scss']
})
export class MobileNavComponent implements OnDestroy {
  @Output() onToggleMenu = new EventEmitter();
  icons = Icons;
  context: UserContext;
  subscription = new Subscription();

  constructor(
    private _userContextService: UserContextService,
    // private _authService: AuthService
  ) {
    this.subscription.add(
      this._userContextService.context$
        .subscribe(context => this.context = context));
  }

  login(): void {
    // this._authService.prepareLogin();
  }

  toggleMenu() {
    this.onToggleMenu.emit();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
