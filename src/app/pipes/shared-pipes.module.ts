import { NgModule } from '@angular/core';

import { CoinNotationPipe } from './coin-notation.pipe';

@NgModule({
  declarations: [
    CoinNotationPipe
  ],
  exports: [
    CoinNotationPipe
  ]
})
export class SharedPipesModule { }
