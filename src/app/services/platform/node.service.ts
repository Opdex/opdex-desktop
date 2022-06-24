import { INodeStatus } from '@interfaces/full-node.interface';
import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class NodeService {
  constructor(private _cirrus: CirrusApiService) {

  }

  getStatus(): Observable<INodeStatus> {
    return this._cirrus.getNodeStatus();
  }
}
