import 'reflect-metadata';
import JsonConfigStore from '../JsonConfigStore';
import { ConfigRoot } from '../types';
import { options } from '@bitr/logger';
import { delay } from '../util';
import * as _ from 'lodash';
import { socket } from 'zeromq';
import { ConfigRequester } from '../messages';
import ConfigValidator from '../ConfigValidator';
options.enabled = false;

const configStoreSocketUrl = 'tcp://127.0.0.1:8797';

describe('JsonConfigStore', () => {
  test('JsonConfigStore', async () => {
    const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
    const store = new JsonConfigStore(validator, configStoreSocketUrl);
    store.TTL = 5;
    expect(store.config.language).toBe('en');
    expect(store.config.demoMode).toBe(true);
    expect(store.config.priceMergeSize).toBe(100);
    expect(store.config.brokers.length).toBe(3);
    await delay(10);
    expect(store.config.brokers[0].broker).toBe('Coincheck');
    expect(store.config.brokers[0].enabled).toBe(false);
    expect(store.config.brokers[0].maxLongPosition).toBe(0.3);
    expect(store.config.brokers[1].broker).toBe('Bitflyer');
    expect(store.config.brokers[1].enabled).toBe(true);
    expect(store.config.brokers[1].maxLongPosition).toBe(0.2);
    store.close();
    await delay(10);
  });

  test('set', async () => {
    try {
      const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);
        await store.set(_.merge({}, store.config, { minSize: 0.001 }));
        expect(store.config.minSize).toBe(0.001);
        await store.set(_.merge({}, store.config, { minSize: 0.01 }));
        expect(store.config.minSize).toBe(0.01);
      } finally {
        if (store) {
          store.close();
        }
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('server', async () => {
    const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
    try {
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);

        let client = new ConfigRequester(configStoreSocketUrl);
        try {
          await client.request({ type: 'set', data: { minSize: 0.002 } });
          expect(store.config.minSize).toBe(0.002);

          await client.request({ type: 'set', data: { minSize: 0.01 } });
          expect(store.config.minSize).toBe(0.01);
        } finally {
          client.dispose();
        }
      } finally {
        store.close();
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('server: invalid message', async () => {
    const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
    try {
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);

        let client = socket('req');
        try {
          client.connect(configStoreSocketUrl);
          const reply = await new Promise<string>((resolve) => {
            client.once('message', resolve);
            client.send('invalid message');
          });
          const parsed = JSON.parse(reply.toString());
          expect(parsed.success).toBe(false);
          expect(parsed.reason).toBe('invalid message');
          expect(store.config.minSize).toBe(0.01);
        } finally {
          client.close();
        }
      } finally {
        store.close();
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('server: configValidator throws', async () => {
    const validator = ({
      validate: (config: ConfigRoot) => {
        if (config.maxNetExposure <= 0) {
          throw new Error();
        }
        return true;
      },
    } as unknown) as ConfigValidator;
    try {
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);

        let client = new ConfigRequester(configStoreSocketUrl);
        try {
          const reply = await client.request({ type: 'set', data: { maxNetExposure: -1 } });
          expect(reply.success).toBe(false);
          expect(reply.reason).toBe('invalid config');
          expect(store.config.minSize).toBe(0.01);
        } finally {
          client.dispose();
        }
      } finally {
        store.close();
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('server: invalid message type', async () => {
    const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
    try {
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);

        let client = new ConfigRequester(configStoreSocketUrl);
        try {
          const reply = await client.request({ type: 'invalid' });
          expect(reply.success).toBe(false);
          expect(reply.reason).toBe('invalid message type');
          expect(store.config.minSize).toBe(0.01);
        } finally {
          if (client) {
            client.dispose();
          }
        }
      } finally {
        if (store) {
          store.close();
        }
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('server: get', async () => {
    const validator = ({ validate: (config: ConfigRoot) => true } as unknown) as ConfigValidator;
    try {
      let store = new JsonConfigStore(validator, configStoreSocketUrl);
      try {
        store.TTL = 5;
        expect(store.config.minSize).toBe(0.01);

        let client = new ConfigRequester(configStoreSocketUrl);
        try {
          const reply = await client.request({ type: 'get' });
          expect(reply.success).toBe(true);
          expect(reply.data?.minSize).toBe(0.01);
          expect(store.config.minSize).toBe(0.01);
        } finally {
          if (client) {
            client.dispose();
          }
        }
      } finally {
        if (store) {
          store.close();
        }
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });
});
