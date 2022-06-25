import { INodeStatus } from '@interfaces/full-node.interface';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { BehaviorSubject, filter, Observable, tap } from 'rxjs';

@Injectable({providedIn: 'root'})
export class NodeService {
  private _block: number;
  private _status: INodeStatus;
  private _block$ = new BehaviorSubject<number>(null);
  private _status$ = new BehaviorSubject<INodeStatus>(null);

  constructor(private _cirrus: CirrusApiService) { }

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

  refreshStatus$(): Observable<INodeStatus> {
    return this._cirrus.getNodeStatus()
      .pipe(
        tap((status: INodeStatus) => {
          this._status = status;
          this._status$.next(status);

          if (!this._block || this._block < status.consensusHeight) {
            this._block = status.consensusHeight;
            this._block$.next(this._block);
          }
        })
      );
  }
}
