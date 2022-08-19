import { OnInit, OnDestroy } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Icons } from 'src/app/enums/icons';
import { TokenService } from '@services/platform/token.service';
import { Component, ElementRef, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Token } from '@models/platform/token';

@Component({
  selector: 'opdex-token-keyword-filter-control',
  templateUrl: './token-keyword-filter-control.component.html',
  styleUrls: ['./token-keyword-filter-control.component.scss']
})
export class TokenKeywordFilterControlComponent implements OnInit, OnDestroy {
  @ViewChild('filterInput') filterInput: ElementRef;

  @Input() includeProvisional = false;
  @Output() onTokenSelect = new EventEmitter<Token>();

  control: FormControl;
  icons = Icons;
  subscription = new Subscription();
  tokens: Token[];
  crs: Token;

  constructor(private _tokensService: TokenService) {
    // init loader w/ fake tokens
    this.tokens = [null, null, null, null, null];
    this.control = new FormControl('');

    this.subscription.add(
      this.control.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(value => this.getTokens(value)))
        .subscribe());
  }

  async ngOnInit(): Promise<void> {
    setTimeout(() => this.filterInput.nativeElement.focus());

    this.crs = await this._tokensService.getToken('CRS')
    await this.getTokens(null);
  }

  selectToken(event$?: MatAutocompleteSelectedEvent): void {
    this.onTokenSelect.emit(event$?.option?.value);
  }

  async getTokens(keyword: string): Promise<void> {
    if (keyword === null) {
      const tokens = await this._tokensService.getTokens(0, 5);
      this.tokens = tokens.results;
    } else {
      this.tokens = await this._tokensService.searchTokens(keyword);
    }

    if (!keyword || 'crs'.includes(keyword.toLowerCase()) && this.crs) {
      this.tokens.unshift(this.crs);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
