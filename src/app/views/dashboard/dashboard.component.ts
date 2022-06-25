import { LiquidityPoolFactoryService } from '@services/factory/liquidity-pool-factory.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'opdex-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pools: any[];

  constructor(
    private _poolsFactory: LiquidityPoolFactoryService
  ) { }

  async ngOnInit(): Promise<void> {
    // of(null)
    //   .pipe(
    //     tap(_ => console.log('hit')),
    //     switchMap(_ => liveQuery(() => db.indexer.get(1))),
    //   ).subscribe(value => console.log(value));
    // console.log(index)
    this.pools = await this._poolsFactory.buildLiquidityPools();
  }
}
