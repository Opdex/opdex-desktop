import { CirrusApiService } from '@services/api/cirrus-api.service';
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class NodeService {
  constructor(private _cirrus: CirrusApiService) {

  }

  getStatus(): Observable<any> {
    return this._cirrus.getNodeStatus();
  }
}
