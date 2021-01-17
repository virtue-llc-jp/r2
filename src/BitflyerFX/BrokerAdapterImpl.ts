import {
  BrokerAdapter,
  OrderStatus,
  OrderType,
  TimeInForce,
  OrderSide,
  CashMarginType,
  QuoteSide,
  Order,
  Execution,
  Quote,
  BrokerConfigType,
  BoardState,
} from './types';
import { getLogger } from '@bitr/logger';
import * as _ from 'lodash';
import BrokerApi from './BrokerApi';
import {
  ChildOrdersParam,
  SendChildOrderRequest,
  ChildOrder,
  BoardResponse,
} from './brokerTypes';
import { eRound, toExecution } from './util';

export default class BrokerAdapterImpl implements BrokerAdapter {
  private readonly brokerApi: BrokerApi;
  private readonly log = getLogger('BitflyerFX.BrokerAdapter');
  private readonly productCode = 'FX_BTC_JPY';
  readonly broker = 'BitflyerFX';

  private boardState: BoardState;

  constructor(private readonly config: BrokerConfigType) {
    this.brokerApi = new BrokerApi(this.config.key, this.config.secret);
    this.boardState = BoardState.STOP;
  }

  async send(order: Order): Promise<void> {
    if (order.broker !== this.broker) {
      throw new Error();
    }
    const param = this.mapOrderToSendChildOrderRequest(order);
    const reply = await this.brokerApi.sendChildOrder(param);
    order.brokerOrderId = reply.child_order_acceptance_id;
    order.status = OrderStatus.New;
    order.sentTime = new Date();
    order.lastUpdated = new Date();
  }

  async refresh(order: Order): Promise<void> {
    const orderId = order.brokerOrderId;
    const request: ChildOrdersParam = {
      product_code: this.productCode,
      child_order_acceptance_id: orderId,
    };
    const reply = await this.brokerApi.getChildOrders(request);
    const childOrder = reply[0];
    if (childOrder === undefined) {
      const message = `Unabled to find ${orderId}. GetOrderState failed.`;
      this.log.warn(message);
      return;
    }

    this.setOrderFields(childOrder, order);
    const executions = await this.brokerApi.getExecutions({
      product_code: this.productCode,
      child_order_acceptance_id: orderId,
    });
    order.executions = _.map(executions, (x) => {
      const e = toExecution(order);
      e.size = x.size;
      e.price = x.price;
      e.execTime = new Date(x.exec_date);
      return e as Execution;
    });

    order.lastUpdated = new Date();
  }

  async cancel(order: Order): Promise<void> {
    let productCode = '';
    switch (order.symbol) {
      case 'BTC/JPY':
        productCode = this.productCode;
        break;
      default:
        throw new Error('Not implemented.');
    }
    const request = {
      product_code: productCode,
      child_order_acceptance_id: order.brokerOrderId,
    };
    await this.brokerApi.cancelChildOrder(request);
    order.lastUpdated = new Date();
    order.status = OrderStatus.Canceled;
  }

  async getBtcPosition(): Promise<number> {
    const positions = await this.brokerApi.getPositions();
    this.boardState = await this.getBoardState();
    return _(positions).sumBy((p) => p.size * (p.side === 'BUY' ? 1 : -1));
  }

  async fetchQuotes(): Promise<Quote[]> {
    const response = await this.brokerApi.getBoard();
    this.log.debug(`bitFlyerFX Health: ${this.boardState}`);
    switch (this.boardState) {
      case BoardState.NORMAL:
        return this.mapToQuote(response);
      case BoardState.BUSY:
        return this.mapToQuoteVolZero(response);
      default:
        return this.mapToQuoteVolZero(response);
    }
  }

  private mapOrderToSendChildOrderRequest(order: Order): SendChildOrderRequest {
    if (order.cashMarginType !== CashMarginType.NetOut) {
      throw new Error('Not implemented.');
    }

    let productCode = '';
    switch (order.symbol) {
      case 'BTC/JPY':
        productCode = this.productCode;
        break;
      default:
        throw new Error('Not implemented.');
    }

    let price = 0;
    let childOrderType = '';
    switch (order.type) {
      case OrderType.Limit:
        childOrderType = 'LIMIT';
        price = order.price;
        break;
      case OrderType.Market:
        childOrderType = 'MARKET';
        price = 0;
        break;
      default:
        throw new Error('Not implemented.');
    }

    let timeInForce;
    switch (order.timeInForce) {
      case TimeInForce.None:
        timeInForce = '';
        break;
      case TimeInForce.Fok:
        timeInForce = 'FOK';
        break;
      case TimeInForce.Ioc:
        timeInForce = 'IOC';
        break;
      default:
        throw new Error('Not implemented.');
    }

    return {
      price,
      product_code: productCode,
      child_order_type: childOrderType,
      side: OrderSide[order.side].toUpperCase(),
      size: order.size,
      time_in_force: timeInForce,
    };
  }

  private setOrderFields(childOrder: ChildOrder, order: Order): void {
    order.filledSize = eRound(childOrder.executed_size);
    if (childOrder.child_order_state === 'CANCELED') {
      order.status = OrderStatus.Canceled;
    } else if (childOrder.child_order_state === 'EXPIRED') {
      order.status = OrderStatus.Expired;
    } else if (order.filledSize === order.size) {
      order.status = OrderStatus.Filled;
    } else if (order.filledSize > 0) {
      order.status = OrderStatus.PartiallyFilled;
    }
    order.lastUpdated = new Date();
  }

  private mapToQuote(boardResponse: BoardResponse): Quote[] {
    const asks = _(boardResponse.asks)
      .take(100)
      .map((q) => {
        return {
          broker: this.broker,
          side: QuoteSide.Ask,
          price: Number(q.price),
          volume: Number(q.size),
        };
      })
      .value();
    const bids = _(boardResponse.bids)
      .take(100)
      .map((q) => {
        return {
          broker: this.broker,
          side: QuoteSide.Bid,
          price: Number(q.price),
          volume: Number(q.size),
        };
      })
      .value();
    return _.concat(asks, bids);
  }

  private mapToQuoteVolZero(boardResponse: BoardResponse): Quote[] {
    const asks = _(boardResponse.asks)
      .take(5)
      .map((q) => {
        return {
          broker: this.broker,
          side: QuoteSide.Ask,
          price: Number(q.price),
          volume: Number(0.01),
        };
      })
      .value();
    const bids = _(boardResponse.bids)
      .take(5)
      .map((q) => {
        return {
          broker: this.broker,
          side: QuoteSide.Bid,
          price: Number(q.price),
          volume: Number(0.01),
        };
      })
      .value();
    return _.concat(asks, bids);
  }

  async getBoardState(): Promise<BoardState> {
    return await this.brokerApi.getBoardState();
  }
} /* istanbul ignore next */
