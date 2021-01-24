import MainLimitChecker from '../MainLimitChecker';
import { options } from '@bitr/logger';
import { ConfigRoot, ConfigStore, SpreadAnalysisResult } from '../types';
import PositionService from '../PositionService';
options.enabled = false;

describe('MainLimitChecker', () => {
  test('MaxTargetVolumeLimit - violate', () => {
    const config = { maxTargetVolumePercent: 50 };
    const ps = {} as PositionService;
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.7 } as SpreadAnalysisResult;
    const checker = new MainLimitChecker({ config } as ConfigStore, ps, analysisResult);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Too large Volume');
  });

  test('MaxTargetVolumeLimit - pass', () => {
    const config = { maxTargetVolumePercent: 50 };
    const ps = {} as PositionService;
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.3 } as SpreadAnalysisResult;
    const checker = new MainLimitChecker({ config } as ConfigStore, ps, analysisResult);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(true);
    expect(result.reason).toBe('');
  });

  test('MaxTargetVolumeLimit - undefined', () => {
    const config = { maxTargetVolumePercent: undefined } as unknown as ConfigRoot;
    const ps = {} as PositionService;
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.3 } as SpreadAnalysisResult;
    const checker = new MainLimitChecker({ config } as ConfigStore, ps, analysisResult);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(true);
    expect(result.reason).toBe('');
  });
});
