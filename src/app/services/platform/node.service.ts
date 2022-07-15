import { INodeStatus } from '@interfaces/full-node.interface';
import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class NodeService {
  private _block: number;
  private _status: INodeStatus;
  private _block$ = new BehaviorSubject<number>(null);
  private _status$ = new BehaviorSubject<INodeStatus>(null);

  public get latestBlock() {
    return this._block;
  }

  public get latestBlock$(): Observable<number> {
    return this._block$.asObservable().pipe(filter(block => !!block));
  }

  public get status(): INodeStatus {
    return this._status;
  }

  public get status$(): Observable<INodeStatus> {
    return this._status$.asObservable().pipe(filter(status => !!status));
  }

  public setStatus(status: INodeStatus) {
    this._status = status;
    this._status$.next(status);

    if (!this._block || this._block < status.consensusHeight) {
      this._block = status.consensusHeight;
      this._block$.next(this._block);
    }
  }
}
