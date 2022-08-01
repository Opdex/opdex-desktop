import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'contractParameter'
})
export class ContractParameterPipe implements PipeTransform {
  constructor() { }

  transform(value: string): string {
    if (!!value === false) {
      return null;
    }

    const delimiterIndex = value.indexOf('#');

    if (delimiterIndex < 0) {
      return value;
    }

    const parts = value.split('#');

    return parts[1];
  }
}
