import { getLogger } from '@bitr/logger';
import { nonce, safeQueryStringStringify } from '../util';
import WebClient from '../WebClient';
import {
  SendOrderResponse,
  SendOrderRequest,
  CancelOrderResponse,
  OrdersResponse,
  TradingAccountsResponse,
  PriceLevelsResponse,
  LadderResponse,
  TradingAccount,
  CloseAllResponse,
  ClosingTrade,
  AccountBalanceResponse,
  AccountBalance
} from './types';
import * as jwt from 'jsonwebtoken';
import { TapClient, CLIENT_EVENTS } from 'liquid-tap';
 
export default class BrokerApi {
  private readonly log = getLogger('Quoine.BrokerApi');
  private readonly baseUrl = 'https://api.liquid.com';
  private readonly webClient: WebClient = new WebClient(this.baseUrl);
  private tap: TapClient;
  private bidMap: Map<number, number>;
  private askMap: Map<number, number>;

  constructor(private readonly key: string, private readonly secret: string, private readonly useWebSocket: boolean) {
    if (useWebSocket) {
      this.bidMap = new Map<number, number>();
      this.askMap = new Map<number, number>();
      this.tap = new TapClient({
        auth: {
          tokenId: key,
          tokenSecret: secret
        }
      });
      this.tap.bind(CLIENT_EVENTS.CONNECTED, () => {
        this.log.debug('connected');
        this.bidMap.clear();
        this.askMap.clear();
      });
      this.tap.bind(CLIENT_EVENTS.DISCONNECTED, () => {
        this.log.debug('disconnected');
        this.bidMap.clear();
        this.askMap.clear();
      });
      const chLadder = this.tap.subscribe('price_ladders_cash_btcjpy');
      chLadder.bind('updated', (data) => {
        this.bidMap.clear();
        this.askMap.clear();
        const orderbook = JSON.parse(data.toString()) as LadderResponse;
        if (orderbook.bids) {
          orderbook.bids.forEach(q => {
            q[0] = Number(q[0]);
            q[1] = Number(q[1]);
            if (q[1] === 0) {
              this.bidMap.delete(q[0]);
            } else {
              this.bidMap.set(q[0], q[1]);
            }
          });
        }
        if (orderbook.asks) {
          orderbook.asks.forEach(q => {
            q[0] = Number(q[0]);
            q[1] = Number(q[1]);
            if (q[1] === 0) {
              this.askMap.delete(q[0]);
            } else {
              this.askMap.set(q[0], q[1]);
            }
          });
        }
      });
    }
  }

  async sendOrder(request: SendOrderRequest): Promise<SendOrderResponse> {
    const path = '/orders/';
    return new SendOrderResponse(await this.post<SendOrderResponse, SendOrderRequest>(path, request));
  }

  async cancelOrder(id: string): Promise<CancelOrderResponse> {
    const path = `/orders/${id}/cancel`;
    return await this.put<CancelOrderResponse>(path);
  }

  async getOrders(id: string): Promise<OrdersResponse> {
    const path = `/orders/${id}`;
    return new OrdersResponse(await this.get<OrdersResponse>(path));
  }

  async getTradingAccounts(): Promise<TradingAccountsResponse> {
    const path = '/trading_accounts';
    const response = await this.get<TradingAccountsResponse>(path);
    return response.map(x => new TradingAccount(x));
  }

  async getAccountBalance(): Promise<AccountBalanceResponse> {
    const path = '/accounts/balance';
    const response = await this.get<AccountBalanceResponse>(path);
    return response.map(x => new AccountBalance(x));
  }

  async getPriceLevels(): Promise<PriceLevelsResponse> {
    if (this.useWebSocket) {
      // Web-socket version
      const bids = this.bidMap ? Array.from(this.bidMap.entries()) : [];
      const asks = this.askMap ? Array.from(this.askMap.entries()) : [];
      const res = new PriceLevelsResponse({ buy_price_levels: bids, sell_price_levels: asks });
      return res;
    }
    // Fetch version
    const path = '/products/5/price_levels';
    return new PriceLevelsResponse(await this.webClient.fetch<PriceLevelsResponse>(path, undefined, false));
  }

  async closeAll(): Promise<CloseAllResponse> {
    const path = '/trades/close_all';
    const response = await this.put<CloseAllResponse>(path);
    return response.map(x => new ClosingTrade(x));
  }

  private async call<R>(path: string, method: string, body: string = ''): Promise<R> {
    const n = nonce();
    const payload = {
      path,
      nonce: n,
      token_id: this.key
    };
    const sign = jwt.sign(payload, this.secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Quoine-API-Version': '2',
      'X-Quoine-Auth': sign
    };
    const init = { method, headers, body };
    return await this.webClient.fetch<R>(path, init);
  }

  private async post<R, T>(path: string, requestBody: T): Promise<R> {
    const method = 'POST';
    const body = JSON.stringify(requestBody);
    return await this.call<R>(path, method, body);
  }

  private async get<R, T = never>(path: string, requestParam?: T): Promise<R> {
    const method = 'GET';
    let pathWithParam = path;
    if (requestParam) {
      const param = safeQueryStringStringify(requestParam);
      pathWithParam += `?${param}`;
    }
    return await this.call<R>(pathWithParam, method);
  }

  private async put<R>(path: string): Promise<R> {
    const method = 'PUT';
    return await this.call<R>(path, method);
  }
}
