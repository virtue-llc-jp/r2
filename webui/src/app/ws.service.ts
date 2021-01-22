import { Injectable } from "@angular/core";
import * as Rx from "rxjs";
import { map, filter, share } from 'rxjs/operators';
import {
  Quote,
  WsMessage,
  BrokerMap,
  BrokerPosition,
  SpreadAnalysisResult,
  ConfigRoot,
  PairWithSummary,
  LimitCheckResult,
} from "./types";
import { default as ReconnectingWebSocket } from "reconnecting-websocket";

@Injectable()
export class WsService {
  private readonly host = window.location.hostname;
  private readonly url = `ws://${this.host}:8720`;
  private connected = false;
  error$: Rx.Observable<{ code: string }>;
  config$: Rx.Observable<ConfigRoot>;
  activePair$: Rx.Observable<PairWithSummary[]>;
  log$: Rx.Observable<string>;
  limitCheck$: Rx.Observable<LimitCheckResult>;
  spread$: Rx.Observable<SpreadAnalysisResult>;
  position$: Rx.Observable<BrokerMap<BrokerPosition>>;
  quote$: Rx.Observable<Quote[]>;
  socket: Rx.Subject<MessageEvent>;

  connect() {
    if (this.connected) {
      return;
    }
    const ws = new ReconnectingWebSocket(this.url);
    const observable = new Rx.Observable(
      (obs: Rx.Observer<MessageEvent<any>>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = (e: ErrorEvent) => {
          obs.next.bind(obs)({
            data: JSON.stringify({ type: "error", body: e }),
          });
        };
        return ws.close.bind(ws);
      }
    );
    const observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      },
    };
    this.socket = new Rx.Subject();
    observable.subscribe(this.socket);
    this.socket.subscribe(observer);
    const sharedObservable = this.socket.pipe(share());
    this.quote$ = this.mapMessage<Quote[]>(sharedObservable, "quoteUpdated");
    this.position$ = this.mapMessage<BrokerMap<BrokerPosition>>(
      sharedObservable,
      "positionUpdated"
    );
    this.spread$ = this.mapMessage<SpreadAnalysisResult>(
      sharedObservable,
      "spreadAnalysisDone"
    );
    this.limitCheck$ = this.mapMessage<LimitCheckResult>(
      sharedObservable,
      "limitCheckDone"
    );
    this.log$ = this.mapMessage<string>(sharedObservable, "log");
    this.activePair$ = this.mapMessage<PairWithSummary[]>(
      sharedObservable,
      "activePairRefresh"
    );
    this.config$ = this.mapMessage<ConfigRoot>(
      sharedObservable,
      "configUpdated"
    );
    this.error$ = this.mapMessage<{ code: string }>(sharedObservable, "error");
    this.connected = true;
  }

  private mapMessage<T>(
    sharedObservable: Rx.Observable<MessageEvent>,
    type: string
  ) {
    return sharedObservable.pipe(
      map((x) => JSON.parse(x.data) as WsMessage<T>),
      filter((x) => x.type === type),
      map((x) => x.body)
    );
  }
}
