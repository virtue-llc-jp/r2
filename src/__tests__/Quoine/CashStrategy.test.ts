import CashStrategy from '../../Quoine/CashStrategy';
import BrokerApi from '../../Quoine/BrokerApi';
import nocksetup from './nocksetup';
import * as nock from 'nock';
import { options } from '@bitr/logger';
options.enabled = false;

describe('Quoine.CashStrategy', () => {
  beforeAll(() => {
    nocksetup();
  });

  afterAll(() => {
    nock.restore();
  });

  test('getBtcBalance', async () => {
    const strategy = new CashStrategy(new BrokerApi('key', 'secret', false));
    const balance = await strategy.getBtcPosition();
    expect(balance).toBe(0.04925688);
  });

  test('getBtcBalance unable to find', async () => {
    const strategy = new CashStrategy(new BrokerApi('key', 'secret', false));
    try {
      await strategy.getBtcPosition();
    } catch (ex) {
      expect(ex.message).toContain('Unable to find');
      return;
    }
    throw new Error();
  });
});
