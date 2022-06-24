import { TokenService } from '@services/platform/token.service';
import { PoolService } from '@services/platform/pool.service';
import { PoolRepositoryService } from '@services/data/pool-repository.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'opdex-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit {
  pool: any;

  constructor(
    private _route: ActivatedRoute,
    private _poolRepo: PoolRepositoryService,
    private _poolsService: PoolService,
    private _tokensService: TokenService) { }

  async ngOnInit(): Promise<void> {
    const address = this._route.snapshot.paramMap.get('address');
    const entity = await this._poolRepo.getPoolByAddress(address);

    const [poolDetails, tokenDetails] = await Promise.all([
      lastValueFrom(this._poolsService.getHydratedPool(address, entity.miningPool)),
      lastValueFrom(this._tokensService.getToken(entity.srcToken))
    ]);

    this.pool = {
      pool: { ...entity, ...poolDetails },
      token: tokenDetails
    };
  }
}
