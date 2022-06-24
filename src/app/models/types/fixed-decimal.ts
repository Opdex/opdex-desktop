import { MathService } from "@services/utility/math.service";

export class FixedDecimal {
  private _originalValue: string;
  private _wholeNumber: string;
  private _fractionNumber: string;
  private _formattedValue: string;
  private _decimals: number;

  public get originalValue(): string
  {
    return this._originalValue;
  }

  public get wholeNumber(): string
  {
    return this._wholeNumber;
  }

  public get fractionNumber(): string
  {
    return this._fractionNumber;
  }

  public get formattedValue(): string
  {
    return this._formattedValue;
  }

  public get decimals(): number
  {
    return this._decimals;
  }

  public get bigInt(): bigint
  {
    return BigInt(this._formattedValue.replace('.', ''));
  }

  public get isZero(): boolean {
    return this._formattedValue.replace(/0/g, '') === '.';
  }

  constructor(value: string, decimals: number) {
    // Todo: Potentially throw
    if (!!value === false) value = '0';

     // TS/JS suck, strings can still be interpreted as numbers
    value = value.toString().replace(/,/g, '');

    this._originalValue = value;
    this._decimals = decimals;

    if (!value.includes('.')) {
      value = `${value}.`.padEnd(value.length + 1 + decimals, '0');
    }

    if (value.startsWith('.')) {
      value = `0${value}`;
    } else if (value.startsWith('-.')) {
      value = value.replace('-.', '-0.');
    }

    const parts = value.split('.');
    const wholeNumber = parts[0];
    const fractionNumber = decimals === 0 ? '' : parts[1].padEnd(decimals, '0').substr(0, decimals);

    this._wholeNumber = wholeNumber;
    this._fractionNumber = fractionNumber;
    this._formattedValue = !!fractionNumber ? `${wholeNumber}.${fractionNumber}` : wholeNumber;
  }

  resize(decimals: number): void {
    if (decimals === this.decimals || decimals < 0 || decimals > 18) return;

    if (decimals === 0) { // Going to 0 decimals
      this._fractionNumber = '';
      this._formattedValue = this._wholeNumber;
    } else {
      this._fractionNumber = decimals > this.decimals
        ? this._fractionNumber.padEnd(decimals, '0')
        : this._fractionNumber.substring(0, decimals);

      this._formattedValue = `${this.wholeNumber}.${this.fractionNumber}`;
    }

    this._decimals = decimals;
  }

  static FromBigInt = (sats: BigInt, decimals: number) => {
    var valueString = sats.toString();

    if (valueString.length === decimals) {
      valueString = `0.${valueString}`;
    } else if (valueString.length > decimals) {
      const wholeNumber = valueString.slice(0, valueString.length - decimals);
      const fraction = valueString.slice(valueString.length - decimals);

      valueString = `${wholeNumber}.${fraction}`
    } else {
      valueString = `0.${valueString.padStart(decimals, '0')}`;
    }

    return new FixedDecimal(valueString, decimals);
  }

  static Zero = (decimals: number): FixedDecimal => new FixedDecimal('0', decimals);
  static One = (decimals: number): FixedDecimal => new FixedDecimal('1', decimals);
  static NegativeOne = (decimals: number): FixedDecimal => new FixedDecimal('-1', decimals);
  static OneHundred = (decimals: number): FixedDecimal => new FixedDecimal('100', decimals);
  static NegativeOneHundred = (decimals: number): FixedDecimal => new FixedDecimal('-100', decimals);

  add = (value: FixedDecimal): FixedDecimal => MathService.add(this, value);
  subtract = (value: FixedDecimal): FixedDecimal => MathService.subtract(this, value);
  divide = (value: FixedDecimal): FixedDecimal => MathService.divide(this, value);
  multiply = (value: FixedDecimal): FixedDecimal => MathService.multiply(this, value);
}
