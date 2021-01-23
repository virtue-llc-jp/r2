import { ChronoDB, TimeSeries } from '../chronodb';
import { LevelUp } from '../chronodb/types';
import { getSpreadStatTimeSeries } from '../SpreadStatTimeSeries';
import { SpreadStat } from '../types';

describe('SpreadStatTimeSeries', () => {
  test('get', () => {
    const expected = new TimeSeries<SpreadStat>(
      {
        get: (x) =>
          new Promise((z) => {
            return { timestamp: 123 } as SpreadStat;
          }),
      } as LevelUp,
      ''
    );
    const dbMock: ChronoDB = {
      getTimeSeries: (o: string) => {
        return expected;
      },
    } as ChronoDB;
    getSpreadStatTimeSeries(dbMock);
    const result = dbMock.getTimeSeries<SpreadStat>('');
    expect(result).toBe(expected);
  });
});
