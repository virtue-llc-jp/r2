// tslint:disable
import * as nock from 'nock';
import * as _ from 'lodash';
import BrokerAdapterImpl from '../../Coincheck/BrokerAdapterImpl';
import { OrderStatus, CashMarginType, OrderSide, OrderType, BrokerConfigType, TimeInForce } from '../../types';
import nocksetup from './nocksetup';
import { options } from '@bitr/logger';
import { createOrder } from '../helper';
options.enabled = false;

nocksetup();

const brokerConfig = {
  broker: 'Coincheck',
  key: '',
  secret: '',
  cashMarginType: CashMarginType.MarginOpen
} as BrokerConfigType;

describe('Coincheck BrokerAdapter', () => {
  test('send with invalid cashMarginType', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      'Invalid' as CashMarginType,
      OrderType.Limit,
      undefined
    );
    try {
      await target.send(order);
      expect(true).toBe(false);
    } catch (ex) {
      return;
    }
    expect(true).toBe(false);
  });

  test('CashMarginType MarginOpen is obsoleted', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = createOrder(
      'Coincheck',
      OrderSide.Buy,
      0.005,
      300000,
      CashMarginType.MarginOpen,
      OrderType.Limit,
      undefined
    );
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('getBtcPosition with invalid cashMarginType', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      await target.getBtcPosition();
      expect(true).toBe(false);
    } catch (ex) {
      return;
    }
    expect(true).toBe(false);
  });

  test('getBtcPosition leverage (MarginOpen is obsoleted)', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    try {
      await target.getBtcPosition();
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('refresh', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.Filled,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      broker: 'Coincheck',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      brokerOrderId: '361173028',
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.Filled);
  });

  test('refresh partial fill', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.New,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      broker: 'Coincheck',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      brokerOrderId: '361173028',
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    await target.refresh(order);
    expect(order.status).toBe(OrderStatus.PartiallyFilled);
  });

  test('refresh partial fill', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.New,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      broker: 'Coincheck',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      brokerOrderId: '361173028',
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    try {
      await target.refresh(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('fetchQuotes', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const result = await target.fetchQuotes();
    expect(result.length).toBe(200);
    result.forEach(q => expect(q.broker).toBe('Coincheck'));
  });

  test('send wrong broker order', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      broker: 'Bitflyer',
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.New,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      brokerOrderId: '361173028',
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    try {
      await target.send(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });

  test('cancel', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = { 
      brokerOrderId: '340809935',
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.New,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      broker: 'Coincheck',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    await target.cancel(order);
    expect(order.status).toBe(OrderStatus.Canceled);
  });

  test('cancel failed', async () => {
    const target = new BrokerAdapterImpl(brokerConfig);
    const order = {
      brokerOrderId: '340809935',
      symbol: 'BTC/JPY',
      type: OrderType.Limit,
      timeInForce: TimeInForce.None,
      id: '28f5d9f1-5e13-4bb7-845c-b1b7f02f5e64',
      status: OrderStatus.New,
      creationTime: new Date('2017-10-28T01:20:39.320Z'),
      executions: [],
      broker: 'Coincheck',
      size: 0.01,
      filledSize: 0,
      side: OrderSide.Buy,
      price: 663000,
      cashMarginType: CashMarginType.MarginOpen,
      sentTime: new Date('2017-10-28T01:20:39.236Z'),
      lastUpdated: new Date('2017-10-28T01:20:39.416Z')
    };
    try {
      await target.cancel(order);
    } catch (ex) {
      return;
    }
    expect(false).toBe(true);
  });
});

afterAll(() => {
  nock.restore();
});
