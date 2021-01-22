import { Injectable } from "@angular/core";
import * as Rx from "rxjs";
import { map, filter, share } from "rxjs/operators";
import { WsMessage, LogRecord } from "./types";
import { default as ReconnectingWebSocket } from "reconnecting-websocket";

@Injectable()
export class LogService {
  private readonly host = window.location.hostname;
  private readonly url = `ws://${this.host}:8721`;
  private connected = false;
  log$: Rx.Observable<LogRecord>;
  socket: Rx.Subject<MessageEvent>;

  connect() {
    if (this.connected) {
      return;
    }
    const ws = new ReconnectingWebSocket(this.url);
    const observable = new Rx.Observable((obs: Rx.Subscriber<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      return ws.close.bind(ws);
    });
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
    this.log$ = this.mapMessage<LogRecord>(sharedObservable, "log");
    this.connected = true;
  }

  private mapMessage<T>(
    sharedObservable: Rx.Observable<MessageEvent>,
    type: string
  ) {
    return sharedObservable.pipe(
      map((x) => JSON.parse(x.data) as WsMessage<string>),
      filter((x) => x.type === type),
      map((x) => JSON.parse(x.body))
    );
  }
}
