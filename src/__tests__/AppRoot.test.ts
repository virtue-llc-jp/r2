import AppRoot from '../AppRoot';
import { Container } from 'inversify';
import { options } from '@bitr/logger';
import symbols from '../symbols';
import { ConfigStore } from '../types';
import { interfaces } from 'inversify/dts/interfaces/interfaces';
options.enabled = false;

describe('AppRoot', () => {
  test('start and stop', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Bitflyer' }, { broker: 'Coincheck' }, { broker: 'Quoine' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    container.bind = (symbol: interfaces.ServiceIdentifier<any>) => {
      return {
        toConstantValue(x: any) {
          return {} as interfaces.BindingWhenOnSyntax<any>;
        },
      } as interfaces.BindingToSyntax<any>;
    };
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).toBeCalled();
    await target.stop();
    expect(service.stop).toBeCalled();
  });

  test('unknown broker', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Unknown' }, { broker: 'Coincheck' }, { broker: 'Quoine' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('unknown broker with npmPath', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Unknown', npmPath: 'Unknown' }, { broker: 'Coincheck' }, { broker: 'Quoine' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('unknown broker with wrong npmPath', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Unknown', npmPath: '@bitr/castable' }, { broker: 'Coincheck' }, { broker: 'Quoine' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.start();
    expect(service.start).not.toBeCalled();
  });

  test('start throws', async () => {
    const service = {
      start: async () => {
        throw new Error('Mock start failed.');
      },
      stop: jest.fn(),
    };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Bitflyer' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.start();
  });

  test('stop throws', async () => {
    const service = {
      start: jest.fn(),
      stop: async () => {
        throw new Error('Mock stop failed.');
      },
    };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Bitflyer' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.start();
    await target.stop();
  });

  test('stop with undefined arbitrager', async () => {
    const service = { start: jest.fn(), stop: jest.fn() };
    const container = {
      get(symbol: any) {
        if (symbol === symbols.ConfigStore) {
          return {
            config: {
              brokers: [{ broker: 'Bitflyer' }],
            },
          } as ConfigStore;
        }
        return service;
      },
    } as Container;
    const target = new AppRoot(container);
    await target.stop();
  });
});
