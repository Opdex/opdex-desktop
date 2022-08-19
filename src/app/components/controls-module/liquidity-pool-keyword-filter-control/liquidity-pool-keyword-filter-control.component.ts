import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Icons } from 'src/app/enums/icons';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { LiquidityPool } from '@models/platform/liquidity-pool';
import { LiquidityPoolService } from '@services/platform/liquidity-pool.service';

@Component({
  selector: 'opdex-liquidity-pool-keyword-filter-control',
  templateUrl: './liquidity-pool-keyword-filter-control.component.html',
  styleUrls: ['./liquidity-pool-keyword-filter-control.component.scss']
})
export class LiquidityPoolKeywordFilterControlComponent implements OnInit {
  @ViewChild('filterInput') filterInput: ElementRef;
  @Output() onPoolSelect = new EventEmitter<LiquidityPool>();

  control: FormControl;
  icons = Icons;
  subscription = new Subscription();
  liquidityPools: LiquidityPool[];

  constructor(private _liquidityPoolsService: LiquidityPoolService) {
    this.liquidityPools = [null, null, null, null, null];
    this.control = new FormControl('');

    this.subscription.add(
      this.control.valueChanges
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(value => this.getLiquidityPools(value)))
        .subscribe());
  }

  async ngOnInit(): Promise<void> {
    await this.getLiquidityPools();
  }

  selectLiquidityPool(event$?: MatAutocompleteSelectedEvent): void {
    this.onPoolSelect.emit(event$?.option?.value);
  }

  async getLiquidityPools(keyword?: string): Promise<void> {
    if (!keyword) {
      const pools = await this._liquidityPoolsService.getLiquidityPools(0, 5);
      this.liquidityPools = pools.results;
    } else {
      this.liquidityPools = await this._liquidityPoolsService.searchPools(keyword);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
