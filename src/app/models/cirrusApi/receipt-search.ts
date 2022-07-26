export class ReceiptSearchRequest {
  contract: string;
  event: string;
  fromBlock: number;
  toBlock?: number;
  topics?: string[];

  constructor(contract: string, fromBlock: number, event?: string, toBlock?: number, topics?: string[]) {
    this.contract = contract;
    this.fromBlock = fromBlock;
    this.event = event;
    this.toBlock = toBlock;
    this.topics = topics;
  }

  updateBlocks(fromBlock: number, toBlock?: number) {
    this.fromBlock = fromBlock;
    this.toBlock = toBlock || this.toBlock;
  }

  get query(): string {
    let queryString = `?contractAddress=${this.contract}`;

    if (this.event) queryString += `&eventName=${this.event}`;
    if (this.fromBlock) queryString += `&fromBlock=${this.fromBlock}`;
    if (this.toBlock) queryString += `&toBlock=${this.toBlock}`;
    if (this.topics?.length) queryString += `&topics=${this.topics}`;

    return queryString;
  }
}
