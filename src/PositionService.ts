import { injectable, inject } from 'inversify';
import { ConfigStore, BrokerConfig, BrokerMap, BrokerPosition } from './types';
import { getLogger } from '@bitr/logger';
import * as _ from 'lodash';
import Decimal from 'decimal.js';
import { eRound, splitSymbol, padEnd, padStart } from './util';
import symbols from './symbols';
import BrokerAdapterRouter from './BrokerAdapterRouter';
import BrokerStabilityTracker from './BrokerStabilityTracker';
import t from './intl';
import { EventEmitter } from 'events';

@injectable()
export default class PositionService extends EventEmitter {
  private readonly log = getLogger(this.constructor.name);
  private timer;
  isRefreshing: boolean;
  private _positionMap: BrokerMap<BrokerPosition>;
  private retryCount: number;
  private previousInfoMsg: string;
  private previousDebugMsg: string;

  constructor(
    @inject(symbols.ConfigStore) private readonly configStore: ConfigStore,
    private readonly brokerAdapterRouter: BrokerAdapterRouter,
    private readonly brokerStabilityTracker: BrokerStabilityTracker
  ) {
    super();
    this.retryCount = 0;
  }

  async start(): Promise<void> {
    this.log.debug('Starting PositionService...');
    this.timer = setInterval(
      () => this.refresh(),
      this.configStore.config.positionRefreshInterval
    );
    await this.refresh();
    this.log.debug('Started PositionService.');
  }

  async stop(): Promise<void> {
    this.log.debug('Stopping PositionService...');
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.log.debug('Stopped PositionService.');
  }

  print(): void {
    const { baseCcy } = splitSymbol(this.configStore.config.symbol);
    const isOk = (b) => (b ? 'OK' : 'NG');
    const formatBrokerPosition = (brokerPosition: BrokerPosition) =>
      `${padEnd(brokerPosition.broker, 10)}: ${padStart(
        _.round(brokerPosition.baseCcyPosition, 3),
        6
      )} ${baseCcy}, ` +
      `${t`LongAllowed`}: ${isOk(brokerPosition.longAllowed)}, ` +
      `${t`ShortAllowed`}: ${isOk(brokerPosition.shortAllowed)}`;

    let infoMsg = 'POSITION:\n';
    infoMsg += `Net Exposure: ${_.round(this.netExposure, 3)} ${baseCcy}\n`;
    _.each(this.positionMap, (position: BrokerPosition) => {
      const stability = this.brokerStabilityTracker.stability(position.broker);
      infoMsg += `${formatBrokerPosition(
        position
      )} (Stability: ${stability})\n`;
    });
    if (this.previousInfoMsg !== infoMsg) {
      this.log.info({ hidden: true }, infoMsg);
      this.previousInfoMsg = infoMsg;
    }

    const debugMsg = JSON.stringify(this.positionMap);
    if (this.previousDebugMsg !== debugMsg) {
      this.log.debug(debugMsg);
      this.previousDebugMsg = debugMsg;
    }
  }

  get netExposure() {
    return eRound(
      _.sumBy(
        _.values(this.positionMap),
        (p: BrokerPosition) => p.baseCcyPosition
      )
    );
  }

  get positionMap() {
    return this._positionMap;
  }

  private async refresh(): Promise<void> {
    this.log.debug('Refreshing positions...');
    if (this.isRefreshing) {
      this.log.debug('Already refreshing.');
      if (this.retryCount > 30) {
        this.isRefreshing = false;
      } else {
        this.retryCount += 1;
      }
      return;
    }

    this.isRefreshing = true;
    this.retryCount = 0;
    const config = this.configStore.config;
    const brokerConfigs = config.brokers.filter((b) => b.enabled);
    try {
      const promises = brokerConfigs.map((brokerConfig) =>
        this.getBrokerPosition(brokerConfig, config.minSize)
      );
      const brokerPositions = await Promise.all(promises);
      this._positionMap = _(brokerPositions)
        .map((p: BrokerPosition) => [p.broker, p])
        .fromPairs()
        .value();
      this.emit('positionUpdated', this.positionMap);
    } catch (ex) {
      this.log.error(ex.message);
      this.log.debug(ex.stack);
    } finally {
      this.isRefreshing = false;
      this.log.debug('Finished refresh.');
    }
  }

  private async getBrokerPosition(
    brokerConfig: BrokerConfig,
    minSize: number
  ): Promise<BrokerPosition> {
    const { baseCcy } = splitSymbol(this.configStore.config.symbol);
    const positions = await this.brokerAdapterRouter.getPositions(
      brokerConfig.broker
    );
    const baseCcyPosition = positions.get(baseCcy);
    if (baseCcyPosition === undefined) {
      throw new Error(
        `Unable to find base ccy position in ${
          brokerConfig.broker
        }. ${JSON.stringify([...positions])}`
      );
    }
    const allowedLongSize = _.max([
      0,
      new Decimal(brokerConfig.maxLongPosition)
        .minus(baseCcyPosition)
        .toNumber(),
    ]) as number;
    const allowedShortSize = _.max([
      0,
      new Decimal(brokerConfig.maxShortPosition)
        .plus(baseCcyPosition)
        .toNumber(),
    ]) as number;
    const isStable = this.brokerStabilityTracker.isStable(brokerConfig.broker);
    return {
      broker: brokerConfig.broker,
      baseCcyPosition,
      allowedLongSize,
      allowedShortSize,
      longAllowed: new Decimal(allowedLongSize).gte(minSize) && isStable,
      shortAllowed: new Decimal(allowedShortSize).gte(minSize) && isStable,
    };
  }
} /* istanbul ignore next */
