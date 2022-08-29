export class Log {
  level: string;
  data: any;

  constructor(level: string, data: any) {
    this.level = level;
    this.data = data;
  }
}
