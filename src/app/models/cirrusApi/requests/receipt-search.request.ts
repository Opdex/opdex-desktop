export class ReceiptSearchRequest {
  contract: string;
  event: string;
  fromBlock?: number;
  toBlock?: number;
  topics?: string[];

  constructor(contract: string, event: string, fromBlock: number, toBlock?: number, topics?: string[]) {
    this.contract = contract;
    this.event = event;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.topics = topics;
  }

  get query(): string {
    let queryString = `?contractAddress=${this.contract}&eventName=${this.event}`;

    if (this.fromBlock) queryString += `&fromBlock=${this.fromBlock}`;
    if (this.toBlock) queryString += `&toBlock=${this.toBlock}`;
    if (this.topics?.length) queryString += `&topics=${this.topics}`;

    return queryString;
  }
}
