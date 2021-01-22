import { CashMarginType, OrderSide, OrderType, OrderStatus, TimeInForce } from '../../types';
import MarginOpenStrategy from '../../Coincheck/MarginOpenStrategy';
import nocksetup from './nocksetup';
import BrokerApi from '../../Coincheck/BrokerApi';
import * as nock from 'nock';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
options.enabled = false;

nocksetup();

describe('MarginOpenStrategy', () => {
  test('send leverage buy limit', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', '', false));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
    await strategy.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('340622252');
  });

  test('send fails - not MarginOpen order', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', '', false));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.Cash, OrderType.Limit, undefined);
    try {
      await strategy.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send fails', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', '', false));
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen, OrderType.Limit, undefined);
    try {
      await strategy.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('getBtcPosition Margin', async () => {
    const strategy = new MarginOpenStrategy(new BrokerApi('', '', false));
    const result = await strategy.getBtcPosition();
    expect(result).toBe(-0.14007);
  });

  test('open buy limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      id: '',
      brokerOrderId: '',
      broker: '',
      symbol: 'btc/jpy',
      size: 0.00000001,
      price: 1,
      timeInForce: TimeInForce.None,
      status: OrderStatus.New,
      filledSize: 0,
      creationTime: new Date(),
      sentTime: new Date(),
      lastUpdated: new Date(),
      executions: [],
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Buy,
      type: OrderType.Limit
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('leverage_buy');
  });

  test('open sell limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      id: '',
      brokerOrderId: '',
      broker: '',
      symbol: 'btc/jpy',
      size: 0.00000001,
      price: 1,
      timeInForce: TimeInForce.None,
      status: OrderStatus.New,
      filledSize: 0,
      creationTime: new Date(),
      sentTime: new Date(),
      lastUpdated: new Date(),
      executions: [],
      cashMarginType: CashMarginType.MarginOpen,
      side: OrderSide.Sell,
      type: OrderType.Limit
    };
    const target = strategy.getBrokerOrderType(order);
    expect(target).toBe('leverage_sell');
  });

  test('open invalid side limit', () => {
    const strategy = new MarginOpenStrategy({} as BrokerApi);
    const order = {
      id: '',
      brokerOrderId: '',
      broker: '',
      symbol: 'btc/jpy',
      size: 0.00000001,
      price: 1,
      timeInForce: TimeInForce.None,
      status: OrderStatus.New,
      filledSize: 0,
      creationTime: new Date(),
      sentTime: new Date(),
      lastUpdated: new Date(),
      executions: [],
      cashMarginType: CashMarginType.MarginOpen,
      side: 'Invalid' as OrderSide,
      type: OrderType.Limit
    };
    expect(() => strategy.getBrokerOrderType(order)).toThrow();
  });

  afterAll(() => {
    nock.restore();
  });
});