import { ChronoDB, TimeSeries } from '../chronodb';
import { LevelUp } from '../chronodb/types';
import { getSpreadStatTimeSeries } from '../SpreadStatTimeSeries';
import { SpreadStat } from '../types';

describe('SpreadStatTimeSeries', () => {
  test('get', async () => {
    const ts = new TimeSeries<SpreadStat>(
      {
        get: (x) =>
          new Promise<SpreadStat>((resolve, reject) => {
            resolve({ timestamp: 123 } as SpreadStat);
          }),
      } as LevelUp,
      ''
    );
    const dbMock: ChronoDB = {
      getTimeSeries: (o: string) => {
        return ts;
      },
    } as ChronoDB;
    getSpreadStatTimeSeries(dbMock);
    const result = dbMock.getTimeSeries<SpreadStat>('');
    expect((await result.get('')).timestamp).toBe(123);
  });
});
