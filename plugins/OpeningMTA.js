// 指定された標準偏差の倍率からパラメータを設定する。
//
// minTargetProfitPercent 
//  標準偏差および平均WorstProfitPercentから算出する。
//  上限は標準偏差の上限倍率とする。
//  それ以下では max( 平均Worst絶対値, 標準偏差に倍数値)とする。
// 
// exitTargetProfitPercentRatio
//  minTargetProfitPercentに対する標準偏差倍数値の割合を100％とし
//  指定割合を乗じたものを設定する。
//
// slow start
//  起動直後は取得されるサンプルが古いため、実態にそぐわない値が計算されるため
//  必要なサンプル数が取得されるまで、minTargetProfitPercentに所定の値を加算を行う。

const _ = require('lodash');
const ss = require('simple-statistics');
const { getLogger } = require('@bitr/logger');

const precision = 3;
const sigma_power = 2.10; // 標準偏差の倍率(σ->68.3% 2σ->95.45% 2.33σ->99% 3σ->99.7%)
const sigma_limit = 4.00; // 標準偏差の上限倍率
const profit_ratio = 0.75; // 偏差のうちNetProfitとする割合
const takeSampleCount = 100; // 使用する直近のサンプル数(おおよそサンプル数×3秒間のデータ)

class TestCalcMTA {
  // Constructor is called when initial snapshot of spread stat history has arrived.
  constructor(history) {
    this.history = _.takeRight(history, takeSampleCount);
    this.log = getLogger(this.constructor.name);
    this.profitPercentHistory = this.history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.worstPercentHistory = this.history.map(x => x.worstCase.profitPercentAgainstNotional);
    this.sampleSize = this.profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(this.profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(this.profitPercentHistory) : 0;
    this.worstPercentMean = this.sampleSiza != 0 ? ss.mean(this.worstPercentHistory) : 0;
    this.slowStart = takeSampleCount;
  }

  // The method is called each time new spread stat has arrived, by default every 3 seconds.
  // Return value: part of ConfigRoot or undefined.
  // If part of ConfigRoot is returned, the configuration will be merged. If undefined is returned, no update will be made.
  async handle(spreadStat) {
    this.history = _.tail(this.history);
    this.history.push(spreadStat);
    this.profitPercentHistory = this.history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.worstPercentHistory = this.history.map(x => x.worstCase.profitPercentAgainstNotional);
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(this.profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(this.profitPercentHistory) : 0;
    this.worstPercentMean = this.sampleSiza != 0 ? ss.mean(this.worstPercentHistory) : 0;

    // set μ + σ to minTargetProfitPercent
    const n = this.sampleSize;
    const mean = this.profitPercentMean;
    const worstMean = this.worstPercentMean;
    const standardDeviation = Math.sqrt(this.profitPercentVariance * n/(n-1));
    const stdThreshold = mean + (standardDeviation * sigma_power);
    const limitThreshold = mean + (standardDeviation * sigma_limit);
    const worstThreshold = -1 * worstMean;

    // at least keep worstProfitMean
    // max limited limit_sigma
    let Threshold = 100;
    if (worstThreshold > limitThreshold) {
      Threshold = limitThreshold;
    } 
    else {
      Threshold = worstThreshold > stdThreshold ? worstThreshold : stdThreshold;
    }
    
    let minTargetProfitPercent = _.round(Threshold, precision);

    // exitNetProfitRatio by standardDeviation 
    const exitNetProfitRatio = _.round(
      standardDeviation * sigma_power * profit_ratio * 100 / minTargetProfitPercent, precision
    );

    // Slow start Protection
    if (this.slowStart > 0) {
      minTargetProfitPercent = _.round( minTargetProfitPercent + (this.slowStart-- * 0.1), precision);
    }

    // error
    if (_.isNaN(minTargetProfitPercent) || _.isNaN(exitNetProfitRatio)) {
      return undefined;
    }
    
    setTimeout(() => { 
      this.log.info(
        `μ: ${_.round(mean, precision)}, σ: ${_.round(standardDeviation, precision)
        }, n: ${n} => minTP%: ${minTargetProfitPercent} exit%R: ${exitNetProfitRatio}`
      )
    }, 25);

    // save config
    const config = { minTargetProfitPercent, exitNetProfitRatio };
    return config;
  }
}

module.exports = TestCalcMTA;
