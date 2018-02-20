const _ = require('lodash');
const ss = require('simple-statistics');
const { getLogger } = require('@bitr/logger');

const precision = 3;
const sigma_power = 2.00; // 標準偏差の倍率(σ->68.3% 2σ->95.45% 2.33σ->99% 3σ->99.7%)
const profit_ratio = 0.66; // 偏差のうちNetProfitとする割合
const takeSampleCount = 330; // 使用する直近のサンプル数(aprox *3s)

class TestCalcMTA {
  // Constructor is called when initial snapshot of spread stat history has arrived.
  constructor(history) {
    this.history = _.takeRight(history, takeSampleCount); //historyを保存
    this.log = getLogger(this.constructor.name);
    this.profitPercentHistory = this.history.map(x => x.bestCase.profitPercentAgainstNotional);
    this.worstPercentHistory = this.history.map(x => x.worstCase.profitPercentAgainstNotional);
    this.sampleSize = this.profitPercentHistory.length;
    this.profitPercentMean = this.sampleSize != 0 ? ss.mean(this.profitPercentHistory) : 0;
    this.profitPercentVariance = this.sampleSize != 0 ? ss.variance(this.profitPercentHistory) : 0;
    this.worstPercentMean = this.sampleSiza != 0 ? ss.mean(this.worstPercentHistory) : 0;
    this.slowStart = takeSampleCount / 2;
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
    const worstThreshold = -1 * worstMean;

    // at least keep worstProfitMean 
    const Threshold = worstThreshold > stdThreshold ? worstThreshold : stdThreshold;
    
    let minTargetProfitPercent = _.round(Threshold, precision);

    // exitNetProfitRation by standardDeviation 
    const exitNetProfitRatio = _.round(
      standardDeviation * sigma_power * profit_ratio * 100 / minTargetProfitPercent, precision
    );

    // Slow start Protection
    if (this.slowStart > 0) {
      minTargetProfitPercent += _.round(this.slowStart-- * 0.02, precision);
    }

    // error
    if (_.isNaN(minTargetProfitPercent) || _.isNaN(exitNetProfitRatio)) {
      return undefined;
    }
    this.log.info(
      `μ: ${_.round(mean, precision)}, σ: ${_.round(
        standardDeviation,
        precision
      )}, n: ${n} => minTPP: ${minTargetProfitPercent} eNetPR: ${exitNetProfitRatio}`
    );

    // save config
    const config = { minTargetProfitPercent, exitNetProfitRatio };
    return config;
  }
}

module.exports = TestCalcMTA;
