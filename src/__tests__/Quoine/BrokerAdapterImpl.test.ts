// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Quoine/BrokerAdapterImpl';
import { OrderStatus, CashMarginType, OrderSide, OrderType, BrokerConfigType, Order, TimeInForce } from '../../types';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
options.enabled = false;

const brokerConfig = {
  broker: 'Quoine',
  key: 'key',
  secret: 'secret',
  cashMarginType: CashMarginType.NetOut
} as BrokerConfigType;

describe('Quoine BrokerAdapter', () => {
  beforeAll(() => {
    nocksetup();
  });

  afterAll(() => {
    nock.restore();
  });

  test('send leverage buy limit', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Quoine', OrderSide.Buy, 0.01, 783000, CashMarginType.NetOut, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('118573146');
  });

  test('send cash buy limit', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder('Quoine', OrderSide.Buy, 0.01, 783000, CashMarginType.Cash, OrderType.Limit, 10);
    await target.send(order);
    expect(order.status).toBe(OrderStatus.New);
    expect(order.brokerOrderId).toBe('118573146');
  });

  test('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Bitflyer' } as Order;
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong symbol', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Quoine', symbol: 'ZZZ' } as Order;
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong order type', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { broker: 'Quoine', symbol: 'BTC/JPY', type: OrderType.StopLimit } as Order;
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('send wrong margin type', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      broker: 'Quoine',
      symbol: 'BTC/JPY',
      type: OrderType.Market,
      cashMarginType: CashMarginType.MarginOpen
    } as Order;
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.fetchQuotes();
    expect(result.length).toBe(42);
    result.forEach(q => expect(q.broker).toBe('Quoine'));
  });

  test('getBtcPosition Margin', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.getBtcPosition();
    expect(result).toBe(0.12);
  });

  test('getBtcPosition Cash', async () => {
    const cashConfig = {
      broker: 'Quoine',
      key: 'key',
      secret: 'secret',
      cashMarginType: CashMarginType.Cash
    } as BrokerConfigType;
    const target = new BrokerAdapterImpl(cashConfig);
    const result = await target.getBtcPosition();
    expect(result).toBe(0.04925688);
  });

  test('getBtcPosition strategy not found', async () => {
    const wrongConfig = {
      broker: 'Quoine',
      key: 'key',
      secret: 'secret',
      cashMarginType: CashMarginType.MarginOpen
    } as BrokerConfigType;
    const target = new BrokerAdapterImpl(wrongConfig);
    try {
      await target.getBtcPosition();
    } catch (ex) {
      expect(ex.message).toContain('Unable to find');
      return;
    }
    throw new Error();
  });

  test('getBtcPosition not found', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      await target.getBtcPosition();
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('refresh not filled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: OrderStatus.New,
      creationTime: new Date('2017-11-06T23:46:56.635Z'),
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 783000,
      cashMarginType: CashMarginType.NetOut,
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: new Date('2017-11-06T23:46:56.692Z'),
      lastUpdated: new Date('2017-11-06T23:46:56.692Z')
    } as Order;
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.New);
  });

  test('refresh partially filled', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: OrderStatus.New,
      creationTime: new Date('2017-11-06T23:46:56.635Z'),
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 783000,
      cashMarginType: CashMarginType.NetOut,
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: new Date('2017-11-06T23:46:56.692Z'),
      lastUpdated: new Date('2017-11-06T23:46:56.692Z')
    } as Order;
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.PartiallyFilled);
  });

  test('refresh', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: OrderStatus.New,
      creationTime: new Date('2017-11-06T23:46:56.635Z'),
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 783000,
      cashMarginType: CashMarginType.NetOut,
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: new Date('2017-11-06T23:46:56.692Z'),
      lastUpdated: new Date('2017-11-06T23:46:56.692Z')
    } as Order;
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });

  test('cancel', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: 'b28eaefe-84d8-4110-9917-0e9d5793d7eb',
      status: OrderStatus.New,
      creationTime: new Date('2017-11-06T23:46:56.635Z'),
      executions: [],
      broker: 'Quoine',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 783000,
      cashMarginType: CashMarginType.NetOut,
      leverageLevel: 10,
      brokerOrderId: '118573146',
      sentTime: new Date('2017-11-06T23:46:56.692Z'),
      lastUpdated: new Date('2017-11-06T23:46:56.692Z')
    } as Order;
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });
});
