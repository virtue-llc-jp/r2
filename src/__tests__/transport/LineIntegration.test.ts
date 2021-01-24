import LineIntegration from '../../transport/LineIntegration';
import { LineConfig } from '../../types';
import * as nock from 'nock';
import { delay } from '../../util';

const lineUrl = 'https://notify-api.line.me/api';
const lineApi = nock(lineUrl);

describe('LineIntegration', () => {
  test('line', async () => {
    lineApi.post('/notify').reply(200, 'ok');
    const config = {
      enabled: true,
      token: 'TOKEN',
      keywords: ['error', 'profit']
    } as LineConfig;
    const line = new LineIntegration(config);
    await line.handler('test message');
    await line.handler('with keyword: profit');
  });

  test('line with no keyword', async () => {
    lineApi.post('/notify').reply(200, 'ok');
    const config = {
      enabled: true,
      token: 'TOKEN',
    } as LineConfig;
    const line = new LineIntegration(config);
    await line.handler('test message');
    await line.handler('with keyword: profit');
  });

  test('line error 500 response', async () => {
    lineApi.post('/notify').reply(500, 'ng');
    const config = {
      enabled: true,
      token: 'TOKEN',
      keywords: ['error', 'profit']
    } as LineConfig;
    const line = new LineIntegration(config);
    await line.handler('with keyword: profit');
  });

  test('line exception response', async () => {
    lineApi.post('/notify').replyWithError('mock error');
    const config = {
      enabled: true,
      token: 'TOKEN',
      keywords: ['error', 'profit']
    } as LineConfig;
    const line = new LineIntegration(config);
    await line.handler('with keyword: profit');
    await delay(0);
  });

  afterAll(() => {
    nock.restore();
  });
});