import { TradeComponent } from './views/trade/trade.component';
import { MiningComponent } from './views/mining/mining.component';
import { VaultComponent } from './views/vault/vault.component';
import { TokenComponent } from './views/token/token.component';
import { TokensComponent } from './views/tokens/tokens.component';
import { PoolsComponent } from './views/pools/pools.component';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoolComponent } from './views/pool/pool.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'pools/:address', component: PoolComponent },
  { path: 'pools', component: PoolsComponent },
  { path: 'tokens', component: TokensComponent },
  { path: 'tokens/:address', component: TokenComponent },
  { path: 'vault', component: VaultComponent },
  { path: 'mining', component: MiningComponent },
  { path: 'trade', component: TradeComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
