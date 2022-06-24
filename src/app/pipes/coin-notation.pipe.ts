import { FixedDecimal } from '@models/types/fixed-decimal';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'coinNotation'
})
export class CoinNotationPipe implements PipeTransform {
  transform(value: string, decimals: number = 8): string {
    var valueString = value.toString();

    if (valueString.length === decimals) {
      valueString = `0.${valueString}`;
    } else if (valueString.length > decimals) {
      const wholeNumber = valueString.slice(0, valueString.length - decimals);
      const fraction = valueString.slice(valueString.length - decimals);

      valueString = `${wholeNumber}.${fraction}`
    } else {
      valueString = `0.${valueString.padStart(decimals, '0')}`;
    }

    var fixedDecimal = new FixedDecimal(valueString, decimals);

    return this.numberWithCommas(fixedDecimal.formattedValue);
  }

  private numberWithCommas(num: string): string {
    let parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}

