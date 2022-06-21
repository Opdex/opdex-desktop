import { ParameterType } from '@enums/parameter-type';

export class Parameter {
  type: ParameterType;
  value: string | number;
  result: string;

  constructor(type: ParameterType, value: string | number) {
    this.type = type;
    this.value = value;
    this.result = `${type}#${value}`;
  }
}
