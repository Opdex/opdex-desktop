import { FixedDecimal } from '@models/types/fixed-decimal';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'coinNotation' })
export class CoinNotationPipe implements PipeTransform {
  transform(value: string | BigInt, decimals: number = 8): string {
    if (typeof(value) === 'string') {
      value = BigInt(value);
    }

    const fixedDecimal = FixedDecimal.FromBigInt(value, decimals);

    return this.numberWithCommas(fixedDecimal.formattedValue);
  }

  private numberWithCommas(num: string): string {
    let parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}

