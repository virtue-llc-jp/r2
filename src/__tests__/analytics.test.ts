import AnalyticsService from '../analytics/AnalyticsService';
import { socket } from 'zeromq';
import { delay } from '../util';
import { options } from '@bitr/logger';
import { ConfigResponder, SnapshotResponder } from '../messages';
import { ConfigRoot } from '../types';

options.enabled = false;
const configStoreSocketUrl = 'tcp://127.0.0.1:8796';
const reportServicePubUrl = 'tcp://127.0.0.1:8790';
const reportServiceRepUrl = 'tcp://127.0.0.1:8791';

describe('AnalyticsService', () => {
  test('start/stop', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;

    try {
      let configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config });
      });
      try {
        let rsPub = socket('pub');
        try {
          rsPub.bindSync(reportServicePubUrl);
          try {
            let rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
              respond({ success: true, data: [] });
            });
            try {
              let as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
              try {
                await as.start();
                await delay(10);
              } finally {
                await as.stop();
              }
            } finally {
              rsRep.dispose();
            }
          } finally {
            rsPub.unbindSync(reportServicePubUrl);
          }
        } finally {
          rsPub.close();
        }
      } finally {
        configServer.dispose();
      }
    } catch (ex) {
      console.log(ex);
      expect(true).toBe(false);
    }
  });

  test('snapshot fail', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config });
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: false, data: [] });
      });
      as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
      await as.start();
    } catch (ex) {
      expect(ex.message).toBe('Failed to initial snapshot message.');
    } finally {
      if (as) {
        await as.stop();
      }
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('invalid config', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;
    let configServer, rsPub, rsRep, as;

    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: false, data: config });
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: undefined });
      });

      as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
      await as.start();
      expect(true).toBe(false);
    } catch (ex) {
      expect(ex.message).toBe('Analytics failed to get the config.');
    } finally {
      if (as) {
        await as.stop();
      }
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('invalid config json', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config });
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = socket('rep');
      rsRep.bindSync(reportServiceRepUrl);
      rsRep.on('message', () => {
        rsRep.send('{invalid');
      });
      as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
      await as.start();
      expect(true).toBe(false);
    } catch (ex) {
      expect(ex.message).toBe('Invalid JSON string received.');
    } finally {
      if (as) {
        await as.stop();
      }
      await delay(10);
      rsPub.unbindSync(reportServicePubUrl);
      rsRep.unbindSync(reportServiceRepUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.close();
    }
  });

  test('handleStream', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;
    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config });
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: [] });
      });

      as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
      await as.start();
      as.streamSubscriber.subscribe('sometopic', (message) => console.log(message));
      await delay(100);
      rsPub.send(['spreadStat', JSON.stringify({ pattern: 1 })]);
      rsPub.send(['spreadStat', 'handling']);
      await delay(100);
      rsPub.send(['spreadStat', JSON.stringify({ pattern: 2 })]);
      await delay(100);
      rsPub.send(['spreadStat', '{}']);
      await delay(100);
      rsPub.send(['spreadStat', 'invalid']);
      await delay(100);
      rsPub.send(['sometopic', 'invalid']);
      await delay(100);

      await delay(10);
    } catch (ex) {
      console.log(ex);
      if (process.env.CI && ex.message === 'Address already in use') {
        return;
      }
      expect(true).toBe(false);
    } finally {
      if (as) {
        await as.stop();
      }
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });

  test('stop message', async () => {
    const config = ({
      analytics: {
        enabled: true,
        plugin: '../src/__tests__/DummyPlugin.ts',
        initHistory: { minutes: 3 },
      },
    } as unknown) as ConfigRoot;

    let configServer, rsPub, rsRep, as;
    try {
      configServer = new ConfigResponder(configStoreSocketUrl, (request, respond) => {
        respond({ success: true, data: config });
      });

      rsPub = socket('pub');
      rsPub.bindSync(reportServicePubUrl);

      rsRep = new SnapshotResponder(reportServiceRepUrl, (request, respond) => {
        respond({ success: true, data: [] });
      });
      as = new AnalyticsService(configStoreSocketUrl, reportServicePubUrl, reportServiceRepUrl);
      await as.start();
      process.emit('message', 'invalid', undefined);
      process.emit('message', 'stop', undefined);
      await delay(10);
    } catch (ex) {
      expect(true).toBe(false);
    } finally {
      if (as) {
        await as.stop();
      }
      rsPub.unbindSync(reportServicePubUrl);
      configServer.dispose();
      rsPub.close();
      rsRep.dispose();
    }
  });
});
