import 'reflect-metadata';
import { CashMarginType, OrderType, OrderSide, Order, ConfigStore, ConfigRoot, BrokerAdapter } from '../types';
import BrokerAdapterRouter from '../BrokerAdapterRouter';
import { options } from '@bitr/logger';
import { createOrder } from './helper';
import BrokerStabilityTracker from '../BrokerStabilityTracker';
import OrderService from '../OrderService';
options.enabled = false;

const baBitflyer = {
  broker: 'Bitflyer',
  send: jest.fn(),
  cancel: jest.fn(),
  fetchQuotes: jest.fn(),
  getBtcPosition: jest.fn(),
  refresh: jest.fn()
};

const baQuoine = {
  broker: 'Quoine',
  send: jest.fn(),
  cancel: jest.fn(),
  fetchQuotes: jest.fn(),
  getBtcPosition: jest.fn(),
  refresh: jest.fn()
};

const ba = [baBitflyer, baQuoine];

const config = {
  symbol: 'BTC/JPY',
  stabilityTracker: {
    threshold: 8,
    recoveryInterval: 1000
  },
  brokers: [{ broker: 'dummy1' }, { broker: 'dummy2' }]
} as ConfigRoot;

const orderService = {
  emitOrderUpdated: jest.fn()
} as unknown as OrderService;

const bst = new BrokerStabilityTracker({ config } as ConfigStore);
const baRouter = new BrokerAdapterRouter(ba, bst, { config } as ConfigStore, orderService);

describe('BrokerAdapterRouter', () => {
  test('send', async () => {
    const order = createOrder('Bitflyer', OrderSide.Buy, 0.001, 500000, CashMarginType.Cash, OrderType.Limit, 0);
    await baRouter.send(order);
    expect(baBitflyer.send.mock.calls.length).toBe(1);
    expect(baQuoine.send.mock.calls.length).toBe(0);
  });

  test('fetchQuotes', async () => {
    await baRouter.fetchQuotes('Bitflyer');
    expect(baBitflyer.fetchQuotes.mock.calls.length).toBe(1);
    expect(baQuoine.fetchQuotes.mock.calls.length).toBe(0);
  });

  test('cancel', async () => {
    const order = createOrder('Bitflyer', OrderSide.Buy, 0.001, 500000, CashMarginType.Cash, OrderType.Limit, 0);
    await baRouter.cancel(order);
    expect(baBitflyer.cancel.mock.calls.length).toBe(1);
    expect(baQuoine.cancel.mock.calls.length).toBe(0);
  });

  test('getBtcPosition', async () => {
    await baRouter.getPositions('Quoine');
    expect(baBitflyer.getBtcPosition.mock.calls.length).toBe(0);
    expect(baQuoine.getBtcPosition.mock.calls.length).toBe(1);
  });

  test('refresh', async () => {
    const order = createOrder('Quoine', OrderSide.Buy, 0.001, 500000, CashMarginType.Cash, OrderType.Limit, 0);
    await baRouter.refresh(order);
    expect(baBitflyer.refresh.mock.calls.length).toBe(0);
    expect(baQuoine.refresh.mock.calls.length).toBe(1);
  });

  test('send throws', async () => {
    const baBitflyer2 = {
      broker: 'Bitflyer',
      send: () => {
        throw new Error('dummy');
      },
      cancel: jest.fn(),
      fetchQuotes: () => {
        throw new Error('dummy');
      },
      getBtcPosition: () => {
        throw new Error('dummy');
      },
      refresh: jest.fn()
    } as BrokerAdapter;

    const brokerAdapters = [baBitflyer2];
    const baRouter2 = new BrokerAdapterRouter(brokerAdapters, bst, { config } as ConfigStore, orderService);
    try {
      await baRouter2.send({ broker: 'Bitflyer' } as Order);
    } catch (ex) {
      expect(ex.message).toBe('dummy');
      return;
    }
    expect(true).toBe(false);
  });

  test('fetchQuotes throws', async () => {
    const baBitflyer2 = {
      broker: 'Bitflyer',
      send: () => {
        throw new Error('dummy');
      },
      cancel: jest.fn(),
      fetchQuotes: () => {
        throw new Error('dummy');
      },
      getBtcPosition: () => {
        throw new Error('dummy');
      },
      refresh: jest.fn()
    };

    const brokerAdapters = [baBitflyer2];
    const baRouter2 = new BrokerAdapterRouter(brokerAdapters, bst, { config } as ConfigStore, orderService);

    const quotes = await baRouter2.fetchQuotes('Bitflyer');
    expect(quotes).toEqual([]);
  });

  test('getBtcPosition throws', async () => {
    const baBitflyer2 = {
      broker: 'Bitflyer',
      send: () => {
        throw new Error('dummy');
      },
      cancel: jest.fn(),
      fetchQuotes: () => {
        throw new Error('dummy');
      },
      getBtcPosition: () => {
        throw new Error('dummy');
      },
      refresh: jest.fn()
    };

    const brokerAdapters = [baBitflyer2];
    const baRouter2 = new BrokerAdapterRouter(brokerAdapters, bst, { config } as ConfigStore, orderService);
    try {
      await baRouter2.getPositions('Bitflyer');
    } catch (ex) {
      expect(ex.message).toBe('dummy');
      return;
    }
    expect(true).toBe(false);
  });

  test('getBtcPosition/getPositions not found', async () => {
    const baBitflyer2 = {
      broker: 'Bitflyer'
    } as BrokerAdapter;

    const brokerAdapters = [baBitflyer2];
    const conf = Object.assign({}, config, { symbol: 'XXX/YYY' });
    const baRouter2 = new BrokerAdapterRouter(brokerAdapters, bst, { config: conf } as ConfigStore, orderService);
    try {
      await baRouter2.getPositions('Bitflyer');
    } catch (ex) {
      expect(ex.message).toBe('Unable to find a method to get positions.');
      return;
    }
    expect(true).toBe(false);
  });

  test('getPositions for non BTC/JPY symbol', async () => {
    const baBitflyer2 = {
      broker: 'Bitflyer',
      getPositions: jest.fn()
    } as unknown as BrokerAdapter;

    const brokerAdapters = [baBitflyer2];
    const conf = Object.assign({}, config, { symbol: 'XXX/YYY' });
    const baRouter2 = new BrokerAdapterRouter(brokerAdapters, bst, { config: conf } as ConfigStore, orderService);
    await baRouter2.getPositions('Bitflyer');
    expect(baBitflyer2.getPositions).toBeCalled();
  });
});
